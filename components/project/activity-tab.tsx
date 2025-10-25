"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ActivityLog } from '@/types/database.types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/utils'
import {
  Upload,
  Check,
  X,
  Link2,
  Lock,
  Unlock,
  Calendar,
  Edit,
  Trash2,
  FileText,
  User,
} from 'lucide-react'

interface ActivityTabProps {
  projectId: string
}

interface ActivityWithProfile extends ActivityLog {
  profile?: {
    full_name: string | null
  }
}

const ITEMS_PER_PAGE = 20

export function ActivityTab({ projectId }: ActivityTabProps) {
  const supabase = createClient()
  const [activities, setActivities] = useState<ActivityWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    loadActivities()
  }, [projectId])

  async function loadActivities(loadMore = false) {
    try {
      const offset = loadMore ? activities.length : 0

      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1)

      if (error) throw error

      const newActivities = loadMore
        ? [...activities, ...(data || [])]
        : data || []

      setActivities(newActivities as ActivityWithProfile[])
      setHasMore(data?.length === ITEMS_PER_PAGE)

      if (loadMore) {
        setPage(page + 1)
      }
    } catch (error) {
      console.error('Error loading activities:', error)
    } finally {
      setLoading(false)
    }
  }

  function getActivityIcon(actionType: string) {
    switch (actionType) {
      case 'asset_uploaded':
        return <Upload className="h-5 w-5 text-blue-500" />
      case 'asset_approved':
        return <Check className="h-5 w-5 text-green-500" />
      case 'asset_rejected':
        return <X className="h-5 w-5 text-red-500" />
      case 'link_enabled':
        return <Link2 className="h-5 w-5 text-green-500" />
      case 'link_disabled':
        return <Link2 className="h-5 w-5 text-gray-500" />
      case 'link_password_enabled':
        return <Lock className="h-5 w-5 text-blue-500" />
      case 'link_password_disabled':
        return <Unlock className="h-5 w-5 text-gray-500" />
      case 'link_expiry_updated':
        return <Calendar className="h-5 w-5 text-blue-500" />
      case 'project_updated':
        return <Edit className="h-5 w-5 text-blue-500" />
      case 'project_archived':
        return <Trash2 className="h-5 w-5 text-yellow-500" />
      case 'project_deleted':
        return <Trash2 className="h-5 w-5 text-red-500" />
      case 'form_updated':
        return <FileText className="h-5 w-5 text-blue-500" />
      default:
        return <FileText className="h-5 w-5 text-gray-500" />
    }
  }

  function getActivityDescription(activity: ActivityWithProfile) {
    const details = activity.action_details as any

    switch (activity.action_type) {
      case 'asset_uploaded':
        return 'uploaded a file'
      case 'asset_approved':
        return 'approved a file'
      case 'asset_rejected':
        return 'rejected a file'
      case 'link_enabled':
        return 'enabled the share link'
      case 'link_disabled':
        return 'disabled the share link'
      case 'link_password_enabled':
        return 'enabled password protection'
      case 'link_password_disabled':
        return 'disabled password protection'
      case 'link_expiry_updated':
        return details?.expiry_date
          ? `set link to expire on ${new Date(details.expiry_date).toLocaleDateString()}`
          : 'removed link expiration'
      case 'project_updated':
        return 'updated project details'
      case 'project_archived':
        return 'archived the project'
      case 'project_deleted':
        return 'deleted the project'
      case 'form_updated':
        return 'updated the form'
      default:
        return activity.action_type.replace(/_/g, ' ')
    }
  }

  function getUserName(activity: ActivityWithProfile) {
    if (activity.user_id && activity.profile?.full_name) {
      return activity.profile.full_name
    }
    return activity.user_id ? 'You' : 'Client'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500">No activity yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            {activities.map((activity, index) => (
              <div key={activity.id}>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.action_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm">
                          <span className="font-medium">
                            {getUserName(activity)}
                          </span>{' '}
                          {getActivityDescription(activity)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatRelativeTime(activity.created_at)}
                        </p>
                      </div>
                      {!activity.user_id && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded text-xs text-blue-700">
                          <User className="h-3 w-3" />
                          Client
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {index < activities.length - 1 && (
                  <div className="ml-6 mt-4 border-l-2 border-gray-200 h-4"></div>
                )}
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-6 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => loadActivities(true)}
              >
                Load More
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
