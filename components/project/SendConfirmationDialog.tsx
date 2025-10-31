"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Mail, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

interface ClientReviewSummary {
  email: string
  approved: number
  rejected: number
  pending: number
}

interface SendConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clients: ClientReviewSummary[]
  onConfirm: () => void
  onReviewMore: () => void
  isSending: boolean
}

export function SendConfirmationDialog({
  open,
  onOpenChange,
  clients,
  onConfirm,
  onReviewMore,
  isSending
}: SendConfirmationDialogProps) {
  const totalClients = clients.length
  const totalReviewed = clients.reduce((sum, c) => sum + c.approved + c.rejected, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">Send Review Notifications?</DialogTitle>
              <DialogDescription className="mt-1">
                You're about to email {totalClients} {totalClients === 1 ? 'client' : 'clients'} with {totalReviewed} reviewed asset{totalReviewed !== 1 ? 's' : ''}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 my-4">
          {clients.map((client) => {
            const hasReviewed = client.approved + client.rejected > 0
            if (!hasReviewed) return null

            const allReviewed = client.pending === 0

            return (
              <div
                key={client.email}
                className="border border-slate-200 rounded-lg p-4 bg-slate-50"
              >
                {/* Client Email */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-600" />
                    <span className="font-medium text-slate-900">{client.email}</span>
                  </div>
                  {allReviewed ? (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                      All reviewed
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {client.pending} pending
                    </span>
                  )}
                </div>

                {/* Review Stats */}
                <div className="flex items-center gap-4 text-sm">
                  {client.approved > 0 && (
                    <div className="flex items-center gap-1.5 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="font-medium">{client.approved}</span>
                      <span className="text-slate-600">approved</span>
                    </div>
                  )}
                  {client.rejected > 0 && (
                    <div className="flex items-center gap-1.5 text-red-600">
                      <XCircle className="w-4 h-4" />
                      <span className="font-medium">{client.rejected}</span>
                      <span className="text-slate-600">rejected</span>
                    </div>
                  )}
                </div>

                {/* Pending Warning */}
                {!allReviewed && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800 flex items-start gap-1.5">
                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>
                      <span className="font-medium">Warning:</span> {client.pending} asset{client.pending !== 1 ? 's' : ''} still pending review.
                      Email will only include reviewed assets.
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={onReviewMore}
            disabled={isSending}
            className="gap-2"
          >
            Review More
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSending}
            className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isSending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Send Emails
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
