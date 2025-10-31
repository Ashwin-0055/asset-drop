"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Clock, AlertCircle, Send, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface ReviewSummary {
  totalReviewed: number
  totalApproved: number
  totalRejected: number
  clientCount: number
  totalPending: number
  clients: {
    [email: string]: {
      approved: number
      rejected: number
      pending: number
    }
  }
}

interface ReviewSummaryBannerProps {
  summary: ReviewSummary
  timeRemaining: string
  timerProgress: number
  onSendNow: () => void
  onResetTimer: () => void
  isVisible: boolean
}

export function ReviewSummaryBanner({
  summary,
  timeRemaining,
  timerProgress,
  onSendNow,
  onResetTimer,
  isVisible
}: ReviewSummaryBannerProps) {
  if (!isVisible || summary.totalReviewed === 0) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="mb-6 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-slate-900">
                    Review Complete
                  </h3>
                  <p className="text-sm text-slate-600">
                    Ready to email: <span className="font-medium">{summary.totalReviewed} assets reviewed</span>
                    {' '}({summary.totalApproved} approved, {summary.totalRejected} rejected)
                    {' '}across <span className="font-medium">{summary.clientCount} {summary.clientCount === 1 ? 'client' : 'clients'}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={onResetTimer}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Review More
                </Button>
                <Button
                  onClick={onSendNow}
                  size="sm"
                  className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Send className="w-4 h-4" />
                  Send Emails Now
                </Button>
              </div>
            </div>

            {/* Warning about pending assets */}
            {summary.totalPending > 0 && (
              <div className="flex items-start gap-2 mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-800">
                  <span className="font-medium">Note:</span> You still have{' '}
                  <span className="font-semibold">{summary.totalPending} pending asset{summary.totalPending !== 1 ? 's' : ''}</span>{' '}
                  that haven't been reviewed yet.
                </p>
              </div>
            )}

            {/* Timer Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="w-4 h-4" />
                  <span>Auto-sending in: <span className="font-mono font-semibold text-slate-900">{timeRemaining}</span></span>
                </div>
                <span className="text-xs text-slate-500">
                  Timer resets when you review more assets
                </span>
              </div>
              <Progress value={timerProgress} className="h-2" />
            </div>

            {/* Client breakdown (optional, shown if multiple clients) */}
            {summary.clientCount > 1 && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-xs font-medium text-slate-600 mb-2">Clients receiving emails:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(summary.clients).map(([email, stats]) => {
                    const hasReviewed = stats.approved + stats.rejected > 0
                    if (!hasReviewed) return null

                    return (
                      <div key={email} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded text-xs">
                        <span className="font-medium text-slate-700">{email}</span>
                        <span className="text-slate-500">
                          ({stats.approved + stats.rejected} reviewed
                          {stats.pending > 0 && <>, {stats.pending} pending</>})
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
