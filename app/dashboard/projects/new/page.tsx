'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react'
import { nanoid } from 'nanoid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useCreateProject } from '@/hooks/useProjects'
import { toast } from '@/hooks/use-toast'

export default function NewProjectPage() {
  const router = useRouter()
  const createProject = useCreateProject()
  const [formData, setFormData] = useState({
    name: '',
    clientName: '',
    description: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Project name is required',
        variant: 'destructive',
      })
      return
    }

    try {
      const shareableLinkId = nanoid(12)

      const newProject = await createProject.mutateAsync({
        name: formData.name,
        client_name: formData.clientName || null,
        description: formData.description || null,
        shareable_link_id: shareableLinkId,
        status: 'pending',
      })

      toast({
        title: 'Success!',
        description: 'Project created. Now build your form.',
      })

      // Redirect to form builder
      router.push(`/builder/${newProject.id}`)
    } catch (error) {
      console.error('Error creating project:', error)
      toast({
        title: 'Error',
        description: 'Failed to create project. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleBack = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={handleBack}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-2 shadow-xl">
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-3xl">Create New Project</CardTitle>
              </div>
              <CardDescription className="text-base">
                Enter project details to get started. You&apos;ll build your custom form next.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Project Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base">
                    Project Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Brand Assets Collection"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-12 text-base"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    A descriptive name for your asset collection project
                  </p>
                </div>

                {/* Client Name */}
                <div className="space-y-2">
                  <Label htmlFor="clientName" className="text-base">
                    Client Name
                  </Label>
                  <Input
                    id="clientName"
                    placeholder="e.g., Acme Corporation"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="h-12 text-base"
                  />
                  <p className="text-sm text-muted-foreground">
                    Optional: Who are you collecting assets from?
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="e.g., Collecting logo files, brand guidelines, and marketing materials..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="min-h-[100px] text-base"
                  />
                  <p className="text-sm text-muted-foreground">
                    Optional: Add context about what you&apos;re collecting
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1"
                    disabled={createProject.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 gap-2"
                    disabled={createProject.isPending}
                  >
                    {createProject.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Create & Build Form
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <div className="text-blue-500 text-2xl">💡</div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-blue-900">What&apos;s Next?</h3>
                  <p className="text-sm text-blue-700">
                    After creating your project, you&apos;ll use our drag-and-drop builder to
                    design a custom form for collecting files from your client. Add file uploads,
                    text fields, and more!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
