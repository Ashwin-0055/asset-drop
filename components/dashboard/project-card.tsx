'use client'

import { useState, memo } from 'react'
import { useRouter } from 'next/navigation'
import { MoreVertical, Edit, Trash2, Link2, Copy } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import type { Project } from '@/types/database.types'
import type { ProjectWithStats } from '@/hooks/useProjects'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useDeleteProject } from '@/hooks/useProjects'

interface ProjectCardProps {
  project: ProjectWithStats
  onEdit?: (project: Project) => void
}

export const ProjectCard = memo(function ProjectCard({ project, onEdit }: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const deleteProject = useDeleteProject()

  // Get real completion percentage based on approved assets
  const getProgress = () => {
    // Use the calculated completion percentage from the hook
    if (project.completion_percentage !== undefined) {
      return project.completion_percentage
    }

    // Fallback: if no assets yet, show 0%
    return 0
  }

  // Get status badge variant and color based on completion
  const getStatusConfig = () => {
    const completion = getProgress()

    if (completion === 100) {
      return { variant: 'success' as const, label: 'Complete' }
    } else if (completion >= 50) {
      return { variant: 'default' as const, label: 'In Progress' }
    } else if (completion > 0) {
      return { variant: 'warning' as const, label: 'Started' }
    } else {
      return { variant: 'outline' as const, label: 'No Submissions' }
    }
  }

  const statusConfig = getStatusConfig()
  const progress = getProgress()

  const handleCardClick = () => {
    router.push(`/project/${project.id}`)
  }

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const shareUrl = `${window.location.origin}/collect/${project.shareable_link_id}`

    try {
      await navigator.clipboard.writeText(shareUrl)
      toast({
        title: 'Link copied!',
        description: 'Project link has been copied to clipboard.',
      })
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy link to clipboard.',
        variant: 'destructive',
      })
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onEdit) {
      onEdit(project)
    } else {
      router.push(`/builder/${project.id}`)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()

    const confirmMessage = project.google_drive_folder_id
      ? `Are you sure you want to delete "${project.name}"?\n\nThis will also delete the project folder from Google Drive.`
      : `Are you sure you want to delete "${project.name}"?`

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const result = await deleteProject.mutateAsync(project.id)
      const description = result.driveDeleted
        ? `${project.name} and its Google Drive folder have been deleted.`
        : `${project.name} has been deleted successfully.`

      toast({
        title: 'Project deleted',
        description,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete project. Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card
        className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
        onClick={handleCardClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl font-bold truncate">
                {project.name}
              </CardTitle>
              {project.client_name && (
                <CardDescription className="mt-1 truncate">
                  {project.client_name}
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2 ml-2">
              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyLink}>
                    <Link2 className="mr-2 h-4 w-4" />
                    Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Asset Stats */}
          {project.total_assets !== undefined && project.total_assets > 0 ? (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Assets</span>
              <span>
                <span className="text-green-600 font-medium">{project.approved_assets || 0}</span>
                {' / '}
                <span>{project.total_assets}</span>
                {' approved'}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Assets</span>
              <span>No submissions yet</span>
            </div>
          )}

          {/* Last Updated */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Last updated</span>
            <span>{formatRelativeTime(project.updated_at)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})
