"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Project, FormField } from '@/types/database.types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { Edit, Archive, Trash2, AlertTriangle } from 'lucide-react'

interface SettingsTabProps {
  project: Project
  formFields: FormField[]
  onUpdate: () => void
}

export function SettingsTab({ project, formFields, onUpdate }: SettingsTabProps) {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState(project.name)
  const [clientName, setClientName] = useState(project.client_name || '')
  const [description, setDescription] = useState(project.description || '')
  const [saving, setSaving] = useState(false)

  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  async function saveDetails() {
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Project name is required',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: name.trim(),
          client_name: clientName.trim() || null,
          description: description.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id)

      if (error) throw error

      await supabase.from('activity_log').insert({
        project_id: project.id,
        action_type: 'project_updated',
      })

      onUpdate()
      toast({
        title: 'Success',
        description: 'Project details updated',
      })
    } catch (error) {
      console.error('Error saving project details:', error)
      toast({
        title: 'Error',
        description: 'Failed to update project details',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  async function archiveProject() {
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          status: 'archived',
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id)

      if (error) throw error

      await supabase.from('activity_log').insert({
        project_id: project.id,
        action_type: 'project_archived',
      })

      toast({
        title: 'Success',
        description: 'Project archived',
      })

      router.push('/dashboard')
    } catch (error) {
      console.error('Error archiving project:', error)
      toast({
        title: 'Error',
        description: 'Failed to archive project',
        variant: 'destructive',
      })
    }
  }

  async function deleteProject() {
    if (confirmText !== project.name) {
      toast({
        title: 'Error',
        description: 'Please type the project name to confirm',
        variant: 'destructive',
      })
      return
    }

    try {
      // Log the deletion
      await supabase.from('activity_log').insert({
        project_id: project.id,
        action_type: 'project_deleted',
      })

      // Delete all related data
      await supabase.from('assets').delete().eq('project_id', project.id)
      await supabase.from('form_fields').delete().eq('project_id', project.id)
      await supabase.from('activity_log').delete().eq('project_id', project.id)
      await supabase.from('projects').delete().eq('id', project.id)

      toast({
        title: 'Success',
        description: 'Project deleted',
      })

      router.push('/dashboard')
    } catch (error) {
      console.error('Error deleting project:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete project',
        variant: 'destructive',
      })
    }
  }

  function goToBuilder() {
    router.push(`/builder/${project.id}`)
  }

  return (
    <div className="space-y-6">
      {/* Project Details */}
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>
            Update your project information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-name">Client Name</Label>
            <Input
              id="client-name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter client name (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter project description (optional)"
              rows={4}
            />
          </div>

          <Button onClick={saveDetails} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Form Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Form Configuration</CardTitle>
          <CardDescription>
            Edit the form fields and structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">
                Current form has {formFields.length} field(s)
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                {formFields.slice(0, 5).map(field => (
                  <li key={field.id}>
                    • {field.label} ({field.field_type.replace(/_/g, ' ')})
                  </li>
                ))}
                {formFields.length > 5 && (
                  <li className="text-gray-500">
                    ... and {formFields.length - 5} more
                  </li>
                )}
              </ul>
            </div>

            <Button onClick={goToBuilder} variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Go to Form Builder
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions for this project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
            <div>
              <h3 className="font-medium">Archive Project</h3>
              <p className="text-sm text-gray-600 mt-1">
                Hide this project from your dashboard. You can restore it later.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowArchiveDialog(true)}
              className="border-yellow-400 text-yellow-700 hover:bg-yellow-50"
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg">
            <div>
              <h3 className="font-medium text-red-600">Delete Project</h3>
              <p className="text-sm text-gray-600 mt-1">
                Permanently delete this project and all its data. This action cannot be undone.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Archive Confirmation Dialog */}
      <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to archive this project? You can restore it later from the archives.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowArchiveDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                archiveProject()
                setShowArchiveDialog(false)
              }}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Archive Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Project
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the project
              and all associated data including files, form fields, and activity logs.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm font-medium">
              Please type <span className="font-mono bg-gray-100 px-2 py-1 rounded">{project.name}</span> to confirm:
            </p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type project name"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false)
                setConfirmText('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteProject}
              disabled={confirmText !== project.name}
            >
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
