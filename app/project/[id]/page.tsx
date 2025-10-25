"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Project, FormField } from '@/types/database.types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AssetsTab } from '@/components/project/assets-tab'
import { LinkTab } from '@/components/project/link-tab'
import { ActivityTab } from '@/components/project/activity-tab'
import { SettingsTab } from '@/components/project/settings-tab'
import { Share2, Edit2, Check, X } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const supabase = createClient()

  const [project, setProject] = useState<Project | null>(null)
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [loading, setLoading] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [editingClient, setEditingClient] = useState(false)
  const [tempName, setTempName] = useState('')
  const [tempClient, setTempClient] = useState('')

  useEffect(() => {
    loadProject()
    loadFormFields()
  }, [projectId])

  async function loadProject() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (error) throw error
      setProject(data)
      setTempName(data.name)
      setTempClient(data.client_name || '')
    } catch (error) {
      console.error('Error loading project:', error)
      toast({
        title: 'Error',
        description: 'Failed to load project',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  async function loadFormFields() {
    try {
      const { data, error } = await supabase
        .from('form_fields')
        .select('*')
        .eq('project_id', projectId)
        .order('field_order', { ascending: true })

      if (error) throw error
      setFormFields(data)
    } catch (error) {
      console.error('Error loading form fields:', error)
    }
  }

  async function updateProjectName() {
    if (!project || !tempName.trim()) return

    try {
      const { error } = await supabase
        .from('projects')
        .update({ name: tempName.trim(), updated_at: new Date().toISOString() })
        .eq('id', projectId)

      if (error) throw error

      setProject({ ...project, name: tempName.trim() })
      setEditingName(false)
      toast({
        title: 'Success',
        description: 'Project name updated',
      })
    } catch (error) {
      console.error('Error updating project name:', error)
      toast({
        title: 'Error',
        description: 'Failed to update project name',
        variant: 'destructive',
      })
    }
  }

  async function updateClientName() {
    if (!project) return

    try {
      const { error } = await supabase
        .from('projects')
        .update({ client_name: tempClient.trim() || null, updated_at: new Date().toISOString() })
        .eq('id', projectId)

      if (error) throw error

      setProject({ ...project, client_name: tempClient.trim() || null })
      setEditingClient(false)
      toast({
        title: 'Success',
        description: 'Client name updated',
      })
    } catch (error) {
      console.error('Error updating client name:', error)
      toast({
        title: 'Error',
        description: 'Failed to update client name',
        variant: 'destructive',
      })
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500'
      case 'in_review':
        return 'bg-blue-500'
      case 'complete':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  function copyShareLink() {
    if (!project) return
    const link = `${window.location.origin}/collect/${project.shareable_link_id}`
    navigator.clipboard.writeText(link)
    toast({
      title: 'Link copied',
      description: 'Share link copied to clipboard',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Project not found</h1>
        <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="text-2xl font-bold max-w-md"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') updateProjectName()
                      if (e.key === 'Escape') {
                        setEditingName(false)
                        setTempName(project.name)
                      }
                    }}
                    autoFocus
                  />
                  <Button size="sm" variant="ghost" onClick={updateProjectName}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingName(false)
                      setTempName(project.name)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{project.name}</h1>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingName(true)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="mt-2">
                {editingClient ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={tempClient}
                      onChange={(e) => setTempClient(e.target.value)}
                      placeholder="Client name"
                      className="max-w-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') updateClientName()
                        if (e.key === 'Escape') {
                          setEditingClient(false)
                          setTempClient(project.client_name || '')
                        }
                      }}
                      autoFocus
                    />
                    <Button size="sm" variant="ghost" onClick={updateClientName}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingClient(false)
                        setTempClient(project.client_name || '')
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-gray-600">
                      {project.client_name || 'No client assigned'}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingClient(true)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge className={getStatusColor(project.status)}>
                {project.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <Button onClick={copyShareLink}>
                <Share2 className="h-4 w-4 mr-2" />
                Share Link
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="assets" className="space-y-6">
          <TabsList className="bg-white">
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="link">Link</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="assets">
            <AssetsTab projectId={projectId} formFields={formFields} />
          </TabsContent>

          <TabsContent value="link">
            <LinkTab project={project} onUpdate={loadProject} />
          </TabsContent>

          <TabsContent value="activity">
            <ActivityTab projectId={projectId} />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab project={project} formFields={formFields} onUpdate={loadProject} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
