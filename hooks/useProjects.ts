'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'
import type { Project } from '@/types/database.types'
import { nanoid } from 'nanoid'

interface CreateProjectInput {
  name: string
  client_name?: string
  description?: string
  status?: string
  link_password?: string
  link_expiry?: string
  google_drive_folder_id?: string
}

interface UpdateProjectInput {
  name?: string
  client_name?: string
  description?: string
  status?: string
  link_password?: string
  link_expiry?: string
  link_disabled?: boolean
  google_drive_folder_id?: string
}

// Extended project type with asset stats
export interface ProjectWithStats extends Project {
  total_assets?: number
  approved_assets?: number
  completion_percentage?: number
}

// Fetch all projects for the authenticated user with asset statistics
export function useProjects() {
  const { user } = useAuth()
  const supabase = createClient()

  return useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      if (!user) {
        throw new Error('User must be authenticated to fetch projects')
      }

      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      if (!projects || projects.length === 0) {
        return []
      }

      // Optimized: Fetch all asset stats in just 2 queries instead of N*2 queries
      const projectIds = projects.map(p => p.id)

      // Single query to get all asset counts grouped by project
      const { data: assetCounts } = await supabase
        .from('assets')
        .select('project_id, status')
        .in('project_id', projectIds)

      // Build stats map in memory (much faster than multiple DB queries)
      const statsMap = new Map<string, { total: number; approved: number }>()

      projectIds.forEach(id => {
        statsMap.set(id, { total: 0, approved: 0 })
      })

      if (assetCounts) {
        assetCounts.forEach(asset => {
          const stats = statsMap.get(asset.project_id)!
          stats.total++
          if (asset.status === 'approved') {
            stats.approved++
          }
        })
      }

      // Map projects with their stats
      const projectsWithStats: ProjectWithStats[] = projects.map(project => {
        const stats = statsMap.get(project.id) || { total: 0, approved: 0 }
        const completion = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0

        return {
          ...project,
          total_assets: stats.total,
          approved_assets: stats.approved,
          completion_percentage: completion,
        }
      })

      return projectsWithStats as ProjectWithStats[]
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Fetch a single project by ID
export function useProject(id: string | undefined) {
  const { user } = useAuth()
  const supabase = createClient()

  return useQuery({
    queryKey: ['projects', id],
    queryFn: async () => {
      if (!user) {
        throw new Error('User must be authenticated to fetch project')
      }

      if (!id) {
        throw new Error('Project ID is required')
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data as Project
    },
    enabled: !!user && !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Create a new project
export function useCreateProject() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      if (!user) {
        throw new Error('User must be authenticated to create a project')
      }

      const projectData = {
        user_id: user.id,
        name: input.name,
        client_name: input.client_name ?? null,
        description: input.description ?? null,
        status: input.status ?? 'pending',
        shareable_link_id: nanoid(12),
        link_password: input.link_password ?? null,
        link_expiry: input.link_expiry ?? null,
        link_disabled: false,
        google_drive_folder_id: input.google_drive_folder_id ?? null,
      }

      const { data, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      // Log the activity
      await supabase.from('activity_log').insert({
        project_id: data.id,
        user_id: user.id,
        action_type: 'project_created',
        action_details: {
          project_name: input.name,
        },
      })

      return data as Project
    },
    onSuccess: (data) => {
      // Invalidate and refetch projects list
      queryClient.invalidateQueries({ queryKey: ['projects', user?.id] })
      // Set the newly created project in the cache
      queryClient.setQueryData(['projects', data.id], data)
    },
  })
}

// Update an existing project
export function useUpdateProject() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProjectInput }) => {
      if (!user) {
        throw new Error('User must be authenticated to update a project')
      }

      const updateData = {
        ...data,
        updated_at: new Date().toISOString(),
      }

      const { data: updatedProject, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      // Log the activity
      await supabase.from('activity_log').insert({
        project_id: id,
        user_id: user.id,
        action_type: 'project_updated',
        action_details: {
          updated_fields: Object.keys(data),
        },
      })

      return updatedProject as Project
    },
    onSuccess: (data, variables) => {
      // Update the specific project in the cache
      queryClient.setQueryData(['projects', variables.id], data)
      // Invalidate the projects list to refetch
      queryClient.invalidateQueries({ queryKey: ['projects', user?.id] })
    },
  })
}

// Delete a project
export function useDeleteProject() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) {
        throw new Error('User must be authenticated to delete a project')
      }

      // First, get the project details including Drive folder ID
      const { data: project } = await supabase
        .from('projects')
        .select('name, google_drive_folder_id')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      // Delete the Google Drive folder if it exists
      if (project?.google_drive_folder_id) {
        console.log(`🗑️  Deleting project folder from Drive: ${project.google_drive_folder_id}`)

        try {
          const deleteResponse = await fetch('/api/google-drive/delete-folder', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              folderId: project.google_drive_folder_id,
            }),
          })

          if (!deleteResponse.ok) {
            const errorData = await deleteResponse.json()
            console.warn('⚠️  Failed to delete folder from Drive:', errorData.error)
            // Continue with project deletion even if Drive deletion fails
          } else {
            console.log('✅ Project folder deleted from Google Drive')
          }
        } catch (error) {
          console.error('Error deleting folder from Drive:', error)
          // Continue with project deletion even if Drive deletion fails
        }
      }

      // Delete the project (this will cascade delete related records)
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        throw new Error(error.message)
      }

      // Note: We can't log to activity_log after deleting the project
      // since the project_id foreign key constraint would fail
      // You might want to create a separate deleted_projects log table

      return { id, name: project?.name, driveDeleted: !!project?.google_drive_folder_id }
    },
    onSuccess: (data, id) => {
      // Remove the project from the cache
      queryClient.removeQueries({ queryKey: ['projects', id] })
      // Invalidate the projects list to refetch
      queryClient.invalidateQueries({ queryKey: ['projects', user?.id] })
    },
  })
}
