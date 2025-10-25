'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'
import { useToast } from './use-toast'

interface GoogleDriveTokens {
  id: string
  access_token: string
  refresh_token: string
  token_expiry: string
}

interface UseGoogleDriveReturn {
  isConnected: boolean
  tokens: GoogleDriveTokens | null
  loading: boolean
  connectDrive: () => Promise<{ error: Error | null }>
  disconnectDrive: () => Promise<{ error: Error | null }>
  refreshConnection: () => Promise<void>
}

export function useGoogleDrive(): UseGoogleDriveReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [tokens, setTokens] = useState<GoogleDriveTokens | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createClient()
  const { toast } = useToast()

  const checkConnection = useCallback(async () => {
    if (!user) {
      setIsConnected(false)
      setTokens(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('user_tokens')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        // Log the error but don't show it to user if it's just a connection check
        console.warn('Error checking Google Drive connection:', error)
        setIsConnected(false)
        setTokens(null)
        return
      }

      if (data) {
        setIsConnected(true)
        setTokens(data as GoogleDriveTokens)

        // Check if token is expired or about to expire
        const expiryDate = new Date(data.token_expiry)
        const now = new Date()
        const timeUntilExpiry = expiryDate.getTime() - now.getTime()

        // If token expires in less than 5 minutes, refresh it
        if (timeUntilExpiry < 5 * 60 * 1000) {
          await refreshTokens(data.refresh_token)
        }
      } else {
        setIsConnected(false)
        setTokens(null)
      }
    } catch (error) {
      console.error('Error checking Google Drive connection:', error)
      setIsConnected(false)
      setTokens(null)
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    checkConnection()
  }, [checkConnection])

  const refreshTokens = async (refreshToken: string) => {
    try {
      const response = await fetch('/api/google-drive/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })

      const data = await response.json()

      // Handle token revocation (401 with requiresReconnect flag)
      if (response.status === 401 && data.requiresReconnect) {
        console.warn('Google Drive token revoked, marking as disconnected')
        setIsConnected(false)
        setTokens(null)

        // Show user-friendly notification
        toast({
          title: 'Google Drive Disconnected',
          description: 'Your Google Drive access has been revoked. Please reconnect to continue uploading files.',
          variant: 'destructive',
        })

        // Token already deleted on server side
        return
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to refresh token')
      }

      if (data.access_token && user) {
        // Update tokens in database
        const expiryDate = new Date()
        expiryDate.setSeconds(expiryDate.getSeconds() + (data.expires_in || 3600))

        const { error } = await supabase
          .from('user_tokens')
          .update({
            access_token: data.access_token,
            token_expiry: expiryDate.toISOString(),
          })
          .eq('user_id', user.id)

        if (error) {
          console.error('Error updating tokens:', error)
        } else {
          // Refresh the connection state
          await checkConnection()
        }
      }
    } catch (error) {
      console.error('Error refreshing Google Drive token:', error)
      // Mark as disconnected on error
      setIsConnected(false)
      setTokens(null)
    }
  }

  const connectDrive = async () => {
    try {
      if (!user) {
        return {
          error: new Error('User must be authenticated to connect Google Drive')
        }
      }

      setLoading(true)

      // Get Google OAuth URL from API
      const response = await fetch('/api/google-drive/auth-url', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to get Google auth URL')
      }

      const { url } = await response.json()

      // Redirect to Google OAuth
      window.location.href = url

      return { error: null }
    } catch (error) {
      console.error('Error connecting Google Drive:', error)
      setLoading(false)
      return {
        error: error instanceof Error ? error : new Error('Failed to connect Google Drive')
      }
    }
  }

  const disconnectDrive = async () => {
    try {
      if (!user) {
        return {
          error: new Error('User must be authenticated to disconnect Google Drive')
        }
      }

      setLoading(true)

      const { error } = await supabase
        .from('user_tokens')
        .delete()
        .eq('user_id', user.id)

      if (error) {
        console.error('Error disconnecting Google Drive:', error)
        return { error: new Error(error.message) }
      }

      setIsConnected(false)
      setTokens(null)
      return { error: null }
    } catch (error) {
      console.error('Error disconnecting Google Drive:', error)
      return {
        error: error instanceof Error ? error : new Error('Failed to disconnect Google Drive')
      }
    } finally {
      setLoading(false)
    }
  }

  const refreshConnection = async () => {
    await checkConnection()
  }

  return {
    isConnected,
    tokens,
    loading,
    connectDrive,
    disconnectDrive,
    refreshConnection,
  }
}
