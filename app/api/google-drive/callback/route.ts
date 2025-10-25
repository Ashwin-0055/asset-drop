import { NextRequest, NextResponse } from 'next/server'
import { getTokensFromCode } from '@/lib/google-drive/oauth'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * GET /api/google-drive/callback
 * Handles OAuth callback from Google
 * Exchanges authorization code for tokens and stores them in the database
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error)
      return NextResponse.redirect(
        new URL(`/dashboard?error=${encodeURIComponent(error)}`, request.url)
      )
    }

    // Validate code parameter
    if (!code) {
      return NextResponse.redirect(
        new URL('/dashboard?error=missing_code', request.url)
      )
    }

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code)

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to obtain tokens from Google')
    }

    // Get authenticated user
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('User authentication error:', userError)
      return NextResponse.redirect(
        new URL('/dashboard?error=auth_required', request.url)
      )
    }

    // Calculate token expiry
    const expiryDate = new Date()
    if (tokens.expiry_date) {
      expiryDate.setTime(tokens.expiry_date)
    } else {
      // Default to 1 hour from now if no expiry provided
      expiryDate.setHours(expiryDate.getHours() + 1)
    }

    // Store tokens in user_tokens table
    const { error: insertError } = await supabase
      .from('user_tokens')
      .upsert({
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: expiryDate.toISOString(),
      }, {
        onConflict: 'user_id'
      })

    if (insertError) {
      console.error('Error storing tokens:', insertError)
      throw new Error('Failed to store tokens')
    }

    // Redirect to dashboard on success
    return NextResponse.redirect(
      new URL('/dashboard?drive_connected=true', request.url)
    )
  } catch (error) {
    console.error('Error in OAuth callback:', error)
    return NextResponse.redirect(
      new URL(
        `/dashboard?error=${encodeURIComponent('callback_failed')}`,
        request.url
      )
    )
  }
}
