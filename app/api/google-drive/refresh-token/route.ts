import { NextRequest, NextResponse } from 'next/server'
import { refreshAccessToken } from '@/lib/google-drive/oauth'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * POST /api/google-drive/refresh-token
 * Refreshes the Google Drive access token using the stored refresh token
 * Request body: { user_id: string } (optional - uses authenticated user if not provided)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    // Parse request body (optional user_id override)
    let targetUserId = user.id
    try {
      const body = await request.json()
      if (body.user_id) {
        targetUserId = body.user_id
      }
    } catch {
      // No body or invalid JSON - use authenticated user
    }

    // Fetch refresh token from database
    const { data: tokenData, error: fetchError } = await supabase
      .from('user_tokens')
      .select('refresh_token, access_token')
      .eq('user_id', targetUserId)
      .maybeSingle()

    if (fetchError || !tokenData) {
      console.error('Error fetching tokens:', fetchError)
      return NextResponse.json(
        { error: 'Google Drive not connected. Please authorize first.' },
        { status: 404 }
      )
    }

    if (!tokenData.refresh_token) {
      return NextResponse.json(
        { error: 'No refresh token found. Please re-authorize Google Drive.' },
        { status: 400 }
      )
    }

    // Refresh the access token
    let newTokens
    try {
      newTokens = await refreshAccessToken(tokenData.refresh_token)
    } catch (refreshError: any) {
      // If token is invalid (revoked or expired), delete it from database
      if (refreshError.code === 'INVALID_GRANT') {
        console.warn('Invalid refresh token detected, deleting from database')

        // Delete invalid tokens
        await supabase
          .from('user_tokens')
          .delete()
          .eq('user_id', targetUserId)

        return NextResponse.json(
          {
            error: 'token_revoked',
            message: 'Google Drive access has been revoked. Please reconnect your account.',
            requiresReconnect: true
          },
          { status: 401 }
        )
      }

      // Other errors
      throw refreshError
    }

    if (!newTokens.access_token) {
      throw new Error('Failed to refresh access token: No access token returned')
    }

    // Update tokens in database
    const { error: updateError } = await supabase
      .from('user_tokens')
      .update({
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token || tokenData.refresh_token,
        token_expiry: newTokens.expiry_date
          ? new Date(newTokens.expiry_date).toISOString()
          : new Date(Date.now() + 3600 * 1000).toISOString() // Default to 1 hour from now
      })
      .eq('user_id', targetUserId)

    if (updateError) {
      console.error('Error updating tokens:', updateError)
      throw new Error('Failed to update tokens in database')
    }

    // Return new tokens
    return NextResponse.json({
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token || tokenData.refresh_token,
      expires_at: newTokens.expiry_date
        ? new Date(newTokens.expiry_date).toISOString()
        : null
    }, { status: 200 })
  } catch (error: any) {
    console.error('Error refreshing token:', error)

    // Return appropriate status code based on error type
    const statusCode = error.code === 'INVALID_GRANT' ? 401 : 500

    return NextResponse.json(
      {
        error: 'Failed to refresh access token',
        details: error instanceof Error ? error.message : 'Unknown error',
        requiresReconnect: error.code === 'INVALID_GRANT'
      },
      { status: statusCode }
    )
  }
}
