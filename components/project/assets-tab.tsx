"use client"

import { useEffect, useState, useOptimistic, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Asset, FormField } from '@/types/database.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Check, X, Download, Eye, FileIcon, Image, Video, Music, Loader2, AlertCircle } from 'lucide-react'
import { formatFileSize, formatRelativeTime } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { useReviewTimer } from '@/hooks/useReviewTimer'
import { ReviewSummaryBanner } from './ReviewSummaryBanner'
import { SendConfirmationDialog } from './SendConfirmationDialog'

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
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [assetToReject, setAssetToReject] = useState<Asset | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [assetToApprove, setAssetToApprove] = useState<Asset | null>(null)
  const [approvalRemark, setApprovalRemark] = useState('')
  const [sendingNotification, setSendingNotification] = useState(false)

  // Email batching state
  const [reviewedAssets, setReviewedAssets] = useState<Set<string>>(new Set())
  const [sendConfirmationOpen, setSendConfirmationOpen] = useState(false)

  // Timer for auto-sending emails
  const {
    isActive: isTimerActive,
    startTimer,
    resetTimer,
    stopTimer,
    formatTimeRemaining,
    getProgress
  } = useReviewTimer({
    onTimerExpire: () => {
      // When timer expires, show confirmation dialog
      setSendConfirmationOpen(true)
    },
    enabled: reviewedAssets.size > 0
  })

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

  async function updateAssetStatus(assetId: string, status: 'approved' | 'rejected', remark?: string) {
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

      // Update status in database (with remark if provided)
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      }

      if (status === 'rejected' && remark) {
        updateData.rejection_reason = remark
      } else if (status === 'approved' && remark) {
        updateData.approval_remark = remark
      }

      const { error } = await supabase
        .from('assets')
        .update(updateData)
        .eq('id', assetId)

      if (error) throw error

      // Update actual state with remark
      const updatedAsset = status === 'approved'
        ? { ...asset, status, approval_remark: remark }
        : { ...asset, status, rejection_reason: remark }

      setAssets(assets.map(a => a.id === assetId ? updatedAsset : a))

      // Log activity
      await supabase.from('activity_log').insert({
        project_id: projectId,
        action_type: status === 'approved' ? 'asset_approved' : 'asset_rejected',
        action_details: {
          asset_id: assetId,
          deleted_from_drive: status === 'rejected' && asset?.google_drive_file_id !== 'text-response',
          remark: remark || null
        },
      })

      toast({
        title: 'Success',
        description: status === 'rejected'
          ? 'Asset rejected and deleted from Google Drive'
          : 'Asset approved',
      })

      // Track reviewed asset for batched email sending
      if (asset?.client_email) {
        setReviewedAssets(prev => {
          const updated = new Set(prev)
          updated.add(assetId)
          return updated
        })

        // Start or reset timer (extends session if already reviewing)
        if (reviewedAssets.size === 0) {
          // First review - start timer
          startTimer()
        } else {
          // Subsequent review - reset timer (extend session)
          resetTimer()
        }

        console.log(`✅ Asset marked for review email - Timer ${reviewedAssets.size === 0 ? 'started' : 'reset'}`)
      }

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

  // Send batched review notifications to all clients
  async function sendBatchedNotifications() {
    try {
      setSendingNotification(true)

      // Get unique client emails from reviewed assets
      const reviewedAssetsList = assets.filter(a => reviewedAssets.has(a.id))
      const clientEmails = [...new Set(reviewedAssetsList.map(a => a.client_email).filter(Boolean))]

      console.log(`📧 Sending batched notifications to ${clientEmails.length} clients...`)

      let successCount = 0
      let failureCount = 0

      // Send email to each client
      for (const clientEmail of clientEmails) {
        try {
          const response = await fetch('/api/send-review-notification', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              clientEmail,
              projectId
            })
          })

          if (response.ok) {
            successCount++
            console.log(`✅ Email sent to ${clientEmail}`)
          } else {
            failureCount++
            const errorData = await response.json()
            console.error(`❌ Failed to send to ${clientEmail}:`, errorData.error)
          }
        } catch (error) {
          failureCount++
          console.error(`❌ Error sending to ${clientEmail}:`, error)
        }
      }

      // Clear reviewed assets and stop timer
      setReviewedAssets(new Set())
      stopTimer()

      // Close confirmation dialog
      setSendConfirmationOpen(false)

      // Show success toast
      if (successCount > 0) {
        toast({
          title: 'Emails Sent Successfully',
          description: `Review notifications sent to ${successCount} ${successCount === 1 ? 'client' : 'clients'}${failureCount > 0 ? ` (${failureCount} failed)` : ''}`,
        })
      } else {
        toast({
          title: 'Email Sending Failed',
          description: 'Failed to send review notifications. Please check your email service configuration.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error sending batched notifications:', error)
      toast({
        title: 'Error',
        description: 'Failed to send review notifications',
        variant: 'destructive',
      })
    } finally {
      setSendingNotification(false)
    }
  }

  function handleRejectClick(asset: Asset) {
    setAssetToReject(asset)
    setRejectionReason('')
    setRejectDialogOpen(true)
  }

  async function handleRejectConfirm() {
    if (assetToReject) {
      await updateAssetStatus(assetToReject.id, 'rejected', rejectionReason)
      setRejectDialogOpen(false)
      setAssetToReject(null)
      setRejectionReason('')
    }
  }

  function handleApproveClick(asset: Asset) {
    setAssetToApprove(asset)
    setApprovalRemark('')
    setApproveDialogOpen(true)
  }

  async function handleApproveConfirm() {
    if (assetToApprove) {
      await updateAssetStatus(assetToApprove.id, 'approved', approvalRemark)
      setApproveDialogOpen(false)
      setAssetToApprove(null)
      setApprovalRemark('')
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

  // Compute review summary for banner and dialog
  const reviewSummary = useMemo(() => {
    const reviewedAssetsList = assets.filter(a => reviewedAssets.has(a.id))

    // Group by client email
    const clientStats: { [email: string]: { approved: number; rejected: number; pending: number } } = {}

    assets.forEach(asset => {
      if (!asset.client_email) return

      if (!clientStats[asset.client_email]) {
        clientStats[asset.client_email] = { approved: 0, rejected: 0, pending: 0 }
      }

      if (reviewedAssets.has(asset.id)) {
        if (asset.status === 'approved') {
          clientStats[asset.client_email].approved++
        } else if (asset.status === 'rejected') {
          clientStats[asset.client_email].rejected++
        }
      } else if (asset.status === 'pending') {
        clientStats[asset.client_email].pending++
      }
    })

    const totalReviewed = reviewedAssetsList.length
    const totalApproved = reviewedAssetsList.filter(a => a.status === 'approved').length
    const totalRejected = reviewedAssetsList.filter(a => a.status === 'rejected').length
    const clientCount = Object.keys(clientStats).filter(email =>
      clientStats[email].approved + clientStats[email].rejected > 0
    ).length
    const totalPending = assets.filter(a => a.status === 'pending' && !reviewedAssets.has(a.id)).length

    return {
      totalReviewed,
      totalApproved,
      totalRejected,
      clientCount,
      totalPending,
      clients: clientStats
    }
  }, [assets, reviewedAssets])

  // Prepare client summary for confirmation dialog
  const clientSummaries = useMemo(() => {
    return Object.entries(reviewSummary.clients)
      .filter(([_, stats]) => stats.approved + stats.rejected > 0)
      .map(([email, stats]) => ({
        email,
        ...stats
      }))
  }, [reviewSummary])

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
      {/* Review Summary Banner */}
      <ReviewSummaryBanner
        summary={reviewSummary}
        timeRemaining={formatTimeRemaining()}
        timerProgress={getProgress()}
        onSendNow={() => setSendConfirmationOpen(true)}
        onResetTimer={resetTimer}
        isVisible={reviewedAssets.size > 0 && isTimerActive}
      />

      {/* Send Confirmation Dialog */}
      <SendConfirmationDialog
        open={sendConfirmationOpen}
        onOpenChange={setSendConfirmationOpen}
        clients={clientSummaries}
        onConfirm={sendBatchedNotifications}
        onReviewMore={() => {
          resetTimer()
          setSendConfirmationOpen(false)
        }}
        isSending={sendingNotification}
      />

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
                            {/* Display approval remark if approved */}
                            {asset.status === 'approved' && asset.approval_remark && (
                              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-md">
                                <div className="flex items-start gap-2">
                                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-xs font-semibold text-green-900">Approval Note:</p>
                                    <p className="text-sm text-green-800 mt-1">{asset.approval_remark}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            {/* Display rejection reason if rejected */}
                            {asset.status === 'rejected' && asset.rejection_reason && (
                              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-xs font-semibold text-red-900">Rejection Reason:</p>
                                    <p className="text-sm text-red-800 mt-1">{asset.rejection_reason}</p>
                                  </div>
                                </div>
                              </div>
                            )}
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

                            {/* Display approval remark if approved */}
                            {asset.status === 'approved' && asset.approval_remark && (
                              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                                <div className="flex items-start gap-2">
                                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-xs font-semibold text-green-900">Approval Note:</p>
                                    <p className="text-sm text-green-800 mt-1">{asset.approval_remark}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Display rejection reason if rejected */}
                            {asset.status === 'rejected' && asset.rejection_reason && (
                              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-xs font-semibold text-red-900">Rejection Reason:</p>
                                    <p className="text-sm text-red-800 mt-1">{asset.rejection_reason}</p>
                                  </div>
                                </div>
                              </div>
                            )}

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
                              onClick={() => handleApproveClick(asset)}
                              disabled={processingAssetId === asset.id}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1"
                              onClick={() => handleRejectClick(asset)}
                              disabled={processingAssetId === asset.id}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
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

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Asset</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this {assetToReject?.file_name || 'submission'}.
              This will help the client understand why it was rejected.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="e.g., Image resolution is too low, incorrect file format, content doesn't match requirements..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 mt-2">
              Optional: Leave blank to reject without a specific reason
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false)
                setAssetToReject(null)
                setRejectionReason('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={processingAssetId === assetToReject?.id}
            >
              {processingAssetId === assetToReject?.id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Reject Asset
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Asset</DialogTitle>
            <DialogDescription>
              You can add an optional note for {assetToApprove?.file_name || 'this submission'}.
              This note will be visible to the client in their notification email.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="e.g., Great work! This is perfect for our needs, Looks good! Approved for use..."
              value={approvalRemark}
              onChange={(e) => setApprovalRemark(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 mt-2">
              Optional: Leave blank to approve without a note
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setApproveDialogOpen(false)
                setAssetToApprove(null)
                setApprovalRemark('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApproveConfirm}
              disabled={processingAssetId === assetToApprove?.id}
            >
              {processingAssetId === assetToApprove?.id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Approve Asset
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
