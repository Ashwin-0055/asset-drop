'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, FolderPlus, Loader2 } from 'lucide-react'
import { useProjects } from '@/hooks/useProjects'
import { ProjectCard } from '@/components/dashboard/project-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function DashboardPage() {
  const router = useRouter()
  const { data: projects, isLoading, error } = useProjects()

  const handleCreateProject = () => {
    router.push('/dashboard/projects/new')
  }

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)]">
        <div className="text-center space-y-4">
          <div className="text-destructive text-5xl">⚠️</div>
          <h2 className="text-2xl font-bold">Failed to load projects</h2>
          <p className="text-muted-foreground">
            There was an error loading your projects. Please try again.
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  // Empty State
  if (!projects || projects.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Projects</h1>
          <Button onClick={handleCreateProject} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Create Project
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center h-[calc(100vh-16rem)]">
          <Card className="max-w-md w-full">
            <CardContent className="flex flex-col items-center text-center p-12 space-y-6">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <FolderPlus className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">No active projects yet!</h2>
                <p className="text-muted-foreground">
                  Get started by creating your first project. Organize your assets and share them with clients in seconds.
                </p>
              </div>
              <Button onClick={handleCreateProject} size="lg" className="w-full">
                <Plus className="mr-2 h-5 w-5" />
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Projects Grid
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Button onClick={handleCreateProject} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Create Project
        </Button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {/* Projects Count */}
      <div className="flex justify-center pt-4">
        <p className="text-sm text-muted-foreground">
          Showing {projects.length} {projects.length === 1 ? 'project' : 'projects'}
        </p>
      </div>
    </div>
  )
}
