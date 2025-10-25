"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Project, FormField } from '@/types/database.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FileUploader } from '@/components/client-portal/file-uploader'
import { toast } from '@/hooks/use-toast'
import { Upload, CheckCircle, Lock, AlertCircle, Loader2 } from 'lucide-react'

interface FormValues {
  [fieldId: string]: any
}

export default function ClientPortalPage() {
  const params = useParams()
  const linkId = params.linkId as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<Project | null>(null)
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [formValues, setFormValues] = useState<FormValues>({})
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordRequired, setPasswordRequired] = useState(false)
  const [passwordVerified, setPasswordVerified] = useState(false)
  const [verifyingPassword, setVerifyingPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [driveNotConnected, setDriveNotConnected] = useState(false)

  useEffect(() => {
    loadProject()
  }, [linkId])

  async function loadProject() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('shareable_link_id', linkId)
        .single()

      if (error) throw error

      if (!data) {
        setError('This link does not exist')
        setLoading(false)
        return
      }

      // Check if link is disabled
      if (data.link_disabled) {
        setError('This link has been disabled')
        setLoading(false)
        return
      }

      // Check if link is expired
      if (data.link_expiry && new Date(data.link_expiry) < new Date()) {
        setError('This link has expired')
        setLoading(false)
        return
      }

      // Check if password is required
      if (data.link_password) {
        setPasswordRequired(true)
        if (!passwordVerified) {
          setLoading(false)
          return
        }
      }

      setProject(data)
      await loadFormFields(data.id)

      // Check if project owner has connected Google Drive
      await checkDriveConnection(data.user_id)
    } catch (error) {
      console.error('Error loading project:', error)
      setError('Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  async function checkDriveConnection(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_tokens')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      if (error || !data) {
        setDriveNotConnected(true)
      } else {
        setDriveNotConnected(false)
      }
    } catch (error) {
      console.error('Error checking Drive connection:', error)
      // Don't block form if check fails
      setDriveNotConnected(false)
    }
  }

  async function loadFormFields(projectId: string) {
    try {
      const { data, error } = await supabase
        .from('form_fields')
        .select('*')
        .eq('project_id', projectId)
        .order('field_order', { ascending: true })

      if (error) throw error

      console.log('✅ Loaded form fields:', data)
      console.log('📊 Number of fields:', data?.length || 0)

      setFormFields(data || [])
    } catch (error) {
      console.error('❌ Error loading form fields:', error)
    }
  }

  async function verifyPassword() {
    setVerifyingPassword(true)

    // Add slight delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300))

    if (project && passwordInput === project.link_password) {
      setPasswordVerified(true)
      await loadProject()
    } else {
      toast({
        title: 'Error',
        description: 'Incorrect password',
        variant: 'destructive',
      })
    }

    setVerifyingPassword(false)
  }

  function handleFieldChange(fieldId: string, value: any) {
    setFormValues(prev => ({ ...prev, [fieldId]: value }))
  }

  function validateForm() {
    const requiredFields = formFields.filter(f => f.is_required)

    for (const field of requiredFields) {
      const value = formValues[field.id]

      if (field.field_type === 'file_upload' ||
          field.field_type === 'image_gallery' ||
          field.field_type === 'audio_video') {
        if (!value || value.length === 0) {
          toast({
            title: 'Error',
            description: `${field.label} is required`,
            variant: 'destructive',
          })
          return false
        }
      } else if (field.field_type === 'text_input' ||
                 field.field_type === 'url_field' ||
                 field.field_type === 'code_snippet') {
        if (!value || !value.trim()) {
          toast({
            title: 'Error',
            description: `${field.label} is required`,
            variant: 'destructive',
          })
          return false
        }
      }
    }

    return true
  }

  async function uploadFiles(projectId: string) {
    const uploadedAssets: any[] = []
    const hasFileFields = formFields.some(f =>
      f.field_type === 'file_upload' ||
      f.field_type === 'image_gallery' ||
      f.field_type === 'audio_video'
    )

    // Check if there are any file uploads to process
    const hasFilesToUpload = formFields.some(field => {
      if (field.field_type === 'file_upload' ||
          field.field_type === 'image_gallery' ||
          field.field_type === 'audio_video') {
        const files = formValues[field.id] as File[]
        return files && files.length > 0
      }
      return false
    })

    if (!hasFilesToUpload) {
      console.log('📝 No files to upload, skipping file upload step')
      return uploadedAssets
    }

    for (const field of formFields) {
      if (field.field_type === 'file_upload' ||
          field.field_type === 'image_gallery' ||
          field.field_type === 'audio_video') {
        const files = formValues[field.id] as File[]

        if (!files || files.length === 0) continue

        for (const file of files) {
          // Use API route to upload file
          const formData = new FormData()
          formData.append('file', file)
          formData.append('projectId', projectId)
          if (field.id) {
            formData.append('formFieldId', field.id)
          }

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error(`❌ Failed to upload ${file.name}:`, errorData)

            // Handle specific error: Google Drive not connected
            if (errorData.error?.includes('Google Drive not connected')) {
              throw new Error('The project owner needs to connect their Google Drive account before files can be uploaded. Please contact them to set this up.')
            }

            // Generic error
            throw new Error(`Failed to upload ${file.name}: ${errorData.error || errorData.details || 'Unknown error'}`)
          }

          const asset = await response.json()
          uploadedAssets.push(asset)
        }
      }
    }

    return uploadedAssets
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validateForm()) return

    setSubmitting(true)

    try {
      console.log('📤 Starting form submission...')
      console.log('📝 Form values:', formValues)

      // Upload files via API route
      let uploadedAssets = []
      try {
        uploadedAssets = await uploadFiles(project!.id)
        console.log('✅ Files uploaded:', uploadedAssets.length)
      } catch (uploadError: any) {
        // Show user-friendly error for Drive not connected
        if (uploadError.message?.includes('Google Drive')) {
          toast({
            title: 'Upload Configuration Required',
            description: uploadError.message,
            variant: 'destructive',
          })
          throw uploadError
        }
        // Re-throw other errors
        throw uploadError
      }

      // Save text-based form responses (code snippets, text inputs, URLs)
      console.log('📝 Processing text responses...')
      const textResponses: any[] = []
      for (const field of formFields) {
        if (field.field_type === 'text_input' ||
            field.field_type === 'url_field' ||
            field.field_type === 'code_snippet') {
          const value = formValues[field.id]
          if (value && value.trim()) {
            console.log(`✏️ Found text response for field "${field.label}":`, value.substring(0, 50) + '...')
            textResponses.push({
              project_id: project!.id,
              form_field_id: field.id,
              file_name: `${field.label}.txt`,
              file_type: 'text/plain',
              google_drive_file_id: 'text-response', // Placeholder for text-based responses
              status: 'pending',
              uploaded_by: 'client',
              metadata: {
                field_type: field.field_type,
                content: value,
              },
            })
          }
        }
      }
      console.log(`📊 Total text responses to save: ${textResponses.length}`)

      // Save text responses via API route (bypasses RLS)
      if (textResponses.length > 0) {
        const response = await fetch('/api/submit-text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId: project!.id,
            textResponses: textResponses,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error('❌ Error saving text responses:', errorData)
          throw new Error(errorData.error || 'Failed to save text responses')
        }

        const result = await response.json()
        console.log('✅ Text responses saved:', result.count)
      }

      setSubmitted(true)
    } catch (error: any) {
      console.error('Error submitting form:', error)

      // Only show generic error if we haven't already shown a specific one
      if (!error.message?.includes('Google Drive')) {
        toast({
          title: 'Submission Error',
          description: error.message || 'Failed to submit form. Please try again.',
          variant: 'destructive',
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Link Not Available</h1>
        <p className="text-gray-600">{error}</p>
      </div>
    )
  }

  if (passwordRequired && !passwordVerified) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              <CardTitle>Password Required</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              This link is password protected. Please enter the password to continue.
            </p>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Enter password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !verifyingPassword && verifyPassword()}
                disabled={verifyingPassword}
              />
            </div>
            <Button onClick={verifyPassword} className="w-full" disabled={verifyingPassword}>
              {verifyingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-2">Successfully Submitted!</h1>
            <p className="text-gray-600 mb-6">
              Your files have been uploaded and are being reviewed.
            </p>
            <p className="text-sm text-gray-500">
              You can close this window now.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Upload className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">AssetDrop</h1>
              <p className="text-sm text-gray-500">File Collection Portal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Warning Banner for Drive not connected */}
        {driveNotConnected && (
          <Card className="mb-6 bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 text-sm">File Uploads Currently Unavailable</h3>
                  <p className="text-yellow-800 text-sm mt-1">
                    The project owner hasn't connected their Google Drive account yet. You can still fill out text fields, but file uploads won't work until they complete the setup.
                  </p>
                  <p className="text-yellow-700 text-xs mt-2">
                    If you need to upload files, please contact the project owner to connect their Google Drive.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{project?.name}</CardTitle>
            {project?.description && (
              <p className="text-gray-600 mt-2">{project.description}</p>
            )}
            {project?.client_name && (
              <p className="text-sm text-gray-500 mt-1">
                For: {project.client_name}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {formFields.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No form fields configured yet</p>
                  <p className="text-sm text-gray-400 mt-2">The project owner needs to add fields to this form</p>
                </div>
              )}

              {formFields.map(field => {
                console.log('🔍 Rendering field:', field.field_type, field.label);

                switch (field.field_type) {
                  case 'section_header':
                    return (
                      <div key={field.id} className="border-b pb-2">
                        <h2 className="text-lg font-semibold">{field.label}</h2>
                        {field.help_text && (
                          <p className="text-sm text-gray-600 mt-1">{field.help_text}</p>
                        )}
                      </div>
                    )

                  case 'text_input':
                    return (
                      <div key={field.id} className="space-y-2">
                        <label className="text-sm font-medium">
                          {field.label}
                          {field.is_required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {field.help_text && (
                          <p className="text-sm text-gray-500">{field.help_text}</p>
                        )}
                        <Textarea
                          required={field.is_required}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          rows={3}
                        />
                      </div>
                    )

                  case 'url_field':
                    return (
                      <div key={field.id} className="space-y-2">
                        <label className="text-sm font-medium">
                          {field.label}
                          {field.is_required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {field.help_text && (
                          <p className="text-sm text-gray-500">{field.help_text}</p>
                        )}
                        <Input
                          type="url"
                          required={field.is_required}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          placeholder="https://example.com"
                        />
                      </div>
                    )

                  case 'code_snippet':
                    return (
                      <div key={field.id} className="space-y-2">
                        <label className="text-sm font-medium">
                          {field.label}
                          {field.is_required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {field.help_text && (
                          <p className="text-sm text-gray-500">{field.help_text}</p>
                        )}
                        <Textarea
                          required={field.is_required}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          rows={8}
                          className="font-mono text-sm"
                          placeholder="Paste your code here..."
                        />
                      </div>
                    )

                  case 'file_upload':
                  case 'image_gallery':
                  case 'audio_video':
                    return (
                      <FileUploader
                        key={field.id}
                        fieldId={field.id}
                        label={field.label}
                        helpText={field.help_text}
                        isRequired={field.is_required}
                        acceptedFileTypes={
                          field.field_type === 'image_gallery'
                            ? 'image/*'
                            : field.field_type === 'audio_video'
                            ? 'audio/*,video/*'
                            : '*'
                        }
                        onFilesChange={handleFieldChange}
                        value={formValues[field.id] || []}
                      />
                    )

                  default:
                    console.warn('⚠️ Unknown field type:', field.field_type);
                    return (
                      <div key={field.id} className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-yellow-800">
                          Unsupported field type: <strong>{field.field_type}</strong> ({field.label})
                        </p>
                      </div>
                    )
                }
              })}

              <div className="flex justify-end pt-6 border-t">
                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  className="min-w-[200px]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Submit Files
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
