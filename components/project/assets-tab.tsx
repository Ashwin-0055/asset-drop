"use client"

import { useEffect, useState, useOptimistic } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Asset, FormField } from '@/types/database.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, Download, Eye, FileIcon, Image, Video, Music, Loader2 } from 'lucide-react'
import { formatFileSize, formatRelativeTime } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

interface AssetsTabProps {
  projectId: string
  formFields: FormField[]
}

interface GroupedAssets {
  [fieldId: string]: Asset[]
}

export function AssetsTab({ projectId, formFields }: AssetsTabProps) {
  const supabase = createClient()
  const [assets, setAssets] = useState<Asset[]>([])
  const [groupedAssets, setGroupedAssets] = useState<GroupedAssets>({})
  const [loading, setLoading] = useState(true)
  const [processingAssetId, setProcessingAssetId] = useState<string | null>(null)
  const [downloadingAssetId, setDownloadingAssetId] = useState<string | null>(null)
  const [optimisticAssets, setOptimisticAssets] = useOptimistic(assets)

  useEffect(() => {
    loadAssets()
  }, [projectId])

  useEffect(() => {
    groupAssetsByField()
  }, [assets, formFields])

  async function loadAssets() {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAssets(data || [])
    } catch (error) {
      console.error('Error loading assets:', error)
      toast({
        title: 'Error',
        description: 'Failed to load assets',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  function groupAssetsByField() {
    const grouped: GroupedAssets = {}

    formFields.forEach(field => {
      // Include all field types that collect data
      if (field.field_type === 'file_upload' ||
          field.field_type === 'image_gallery' ||
          field.field_type === 'audio_video' ||
          field.field_type === 'text_input' ||
          field.field_type === 'url_field' ||
          field.field_type === 'code_snippet') {
        grouped[field.id] = assets.filter(asset => asset.form_field_id === field.id)
      }
    })

    setGroupedAssets(grouped)
  }

  async function updateAssetStatus(assetId: string, status: 'approved' | 'rejected') {
    setProcessingAssetId(assetId)

    // Get the asset data before updating
    const asset = assets.find(a => a.id === assetId)

    // Optimistic update
    setOptimisticAssets(
      assets.map(a => a.id === assetId ? { ...a, status } : a)
    )

    try {
      // If rejecting and file is not a text response, delete from Google Drive
      if (status === 'rejected' && asset?.google_drive_file_id !== 'text-response') {
        console.log(`🗑️  Deleting rejected file from Drive: ${asset?.google_drive_file_id}`)

        const deleteResponse = await fetch('/api/google-drive/delete-file', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileId: asset?.google_drive_file_id,
          }),
        })

        if (!deleteResponse.ok) {
          const errorData = await deleteResponse.json()
          console.warn('⚠️  Failed to delete file from Drive:', errorData.error)
          // Continue with status update even if Drive deletion fails
        } else {
          console.log('✅ File deleted from Google Drive')
        }
      }

      // Update status in database
      const { error } = await supabase
        .from('assets')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', assetId)

      if (error) throw error

      // Update actual state
      setAssets(assets.map(a => a.id === assetId ? { ...a, status } : a))

      // Log activity
      await supabase.from('activity_log').insert({
        project_id: projectId,
        action_type: status === 'approved' ? 'asset_approved' : 'asset_rejected',
        action_details: {
          asset_id: assetId,
          deleted_from_drive: status === 'rejected' && asset?.google_drive_file_id !== 'text-response'
        },
      })

      toast({
        title: 'Success',
        description: status === 'rejected'
          ? 'Asset rejected and deleted from Google Drive'
          : 'Asset approved',
      })
    } catch (error) {
      console.error('Error updating asset status:', error)
      // Revert optimistic update
      loadAssets()
      toast({
        title: 'Error',
        description: 'Failed to update asset status',
        variant: 'destructive',
      })
    } finally {
      setProcessingAssetId(null)
    }
  }

  async function downloadAsset(asset: Asset) {
    setDownloadingAssetId(asset.id)

    try {
      // Call API route to get download URL
      const response = await fetch(`/api/projects/${projectId}/download?fileId=${asset.google_drive_file_id}`)

      if (!response.ok) {
        throw new Error('Failed to get download URL')
      }

      const { downloadUrl } = await response.json()

      if (downloadUrl) {
        window.open(downloadUrl, '_blank')
      }
    } catch (error) {
      console.error('Error downloading asset:', error)
      toast({
        title: 'Error',
        description: 'Failed to download asset',
        variant: 'destructive',
      })
    } finally {
      setDownloadingAssetId(null)
    }
  }

  function getFileIcon(fileType: string | null) {
    if (!fileType) return <FileIcon className="h-8 w-8" />

    if (fileType.startsWith('image/')) return <Image className="h-8 w-8" />
    if (fileType.startsWith('video/')) return <Video className="h-8 w-8" />
    if (fileType.startsWith('audio/')) return <Music className="h-8 w-8" />

    return <FileIcon className="h-8 w-8" />
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-500">Rejected</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Helper to check if field is text-based
  function isTextBasedField(fieldType: string) {
    return fieldType === 'text_input' || fieldType === 'url_field' || fieldType === 'code_snippet'
  }

  return (
    <div className="space-y-6">
      {formFields
        .filter(field =>
          field.field_type === 'file_upload' ||
          field.field_type === 'image_gallery' ||
          field.field_type === 'audio_video' ||
          field.field_type === 'text_input' ||
          field.field_type === 'url_field' ||
          field.field_type === 'code_snippet'
        )
        .map(field => (
          <Card key={field.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{field.label}</CardTitle>
                  {field.help_text && (
                    <p className="text-sm text-gray-500 mt-1">{field.help_text}</p>
                  )}
                  {field.internal_note && (
                    <p className="text-sm text-blue-600 mt-1">Note: {field.internal_note}</p>
                  )}
                </div>
                <Badge variant="outline">
                  {groupedAssets[field.id]?.length || 0} {isTextBasedField(field.field_type) ? 'response(s)' : 'file(s)'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {!groupedAssets[field.id] || groupedAssets[field.id].length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <FileIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500">
                    {isTextBasedField(field.field_type) ? 'No responses submitted yet' : 'No files uploaded yet'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedAssets[field.id].map(asset => {
                    // Check if this is a text-based submission
                    const textContent = asset.metadata?.content

                    return (
                      <div
                        key={asset.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        {/* Text-based content display */}
                        {isTextBasedField(field.field_type) && textContent ? (
                          <>
                            <div className="flex items-start justify-between mb-3">
                              <p className="text-sm text-gray-500">Submitted response</p>
                              {getStatusBadge(asset.status)}
                            </div>
                            <div className="bg-gray-50 rounded p-3 mb-3 max-h-48 overflow-y-auto">
                              {field.field_type === 'code_snippet' ? (
                                <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                                  {textContent}
                                </pre>
                              ) : field.field_type === 'url_field' ? (
                                <a
                                  href={textContent}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline break-all"
                                >
                                  {textContent}
                                </a>
                              ) : (
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {textContent}
                                </p>
                              )}
                            </div>
                            <p className="text-xs text-gray-400">
                              {formatRelativeTime(asset.created_at)}
                            </p>
                          </>
                        ) : (
                          /* File-based content display */
                          <>
                            <div className="flex items-start gap-3">
                              <div className="text-gray-400">
                                {getFileIcon(asset.file_type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{asset.file_name}</p>
                                <p className="text-sm text-gray-500">
                                  {asset.file_size && formatFileSize(asset.file_size)}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {formatRelativeTime(asset.created_at)}
                                </p>
                                <div className="mt-2">
                                  {getStatusBadge(asset.status)}
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2 mt-4">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => downloadAsset(asset)}
                                disabled={downloadingAssetId === asset.id}
                              >
                                {downloadingAssetId === asset.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                    Downloading...
                                  </>
                                ) : (
                                  <>
                                    <Download className="h-4 w-4 mr-1" />
                                    Download
                                  </>
                                )}
                              </Button>
                            </div>
                          </>
                        )}

                        {/* Approve/Reject buttons for pending items */}
                        {asset.status === 'pending' && (
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="default"
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={() => updateAssetStatus(asset.id, 'approved')}
                              disabled={processingAssetId === asset.id}
                            >
                              {processingAssetId === asset.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  Approving...
                                </>
                              ) : (
                                <>
                                  <Check className="h-4 w-4 mr-1" />
                                  Approve
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1"
                              onClick={() => updateAssetStatus(asset.id, 'rejected')}
                              disabled={processingAssetId === asset.id}
                            >
                              {processingAssetId === asset.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  Rejecting...
                                </>
                              ) : (
                                <>
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

      {formFields.filter(field =>
        field.field_type === 'file_upload' ||
        field.field_type === 'image_gallery' ||
        field.field_type === 'audio_video' ||
        field.field_type === 'text_input' ||
        field.field_type === 'url_field' ||
        field.field_type === 'code_snippet'
      ).length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500">No submission fields configured</p>
            <p className="text-sm text-gray-400 mt-2">Add file upload or text input fields to collect submissions</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
