import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createServerSupabaseClient()

    try {
      // Exchange code for session
      const { data: { session }, error: authError } = await supabase.auth.exchangeCodeForSession(code)

      if (authError) {
        console.error('Auth callback error:', authError)
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(authError.message)}`, requestUrl.origin)
        )
      }

      if (!session) {
        console.error('No session returned after code exchange')
        return NextResponse.redirect(
          new URL('/login?error=no_session', requestUrl.origin)
        )
      }

      // Get the provider token from the session
      const providerToken = session.provider_token
      const providerRefreshToken = session.provider_refresh_token
      const userId = session.user.id

      // Store Google OAuth tokens in the user_tokens table
      if (providerToken && providerRefreshToken) {
        // Calculate token expiry (Google tokens typically expire in 1 hour)
        const expiryDate = new Date()
        expiryDate.setHours(expiryDate.getHours() + 1)

        // Check if user already has tokens stored
        const { data: existingToken } = await supabase
          .from('user_tokens')
          .select('id')
          .eq('user_id', userId)
          .single()

        if (existingToken) {
          // Update existing tokens
          const { error: updateError } = await supabase
            .from('user_tokens')
            .update({
              access_token: providerToken,
              refresh_token: providerRefreshToken,
              token_expiry: expiryDate.toISOString(),
            })
            .eq('user_id', userId)

          if (updateError) {
            console.error('Error updating user tokens:', updateError)
          }
        } else {
          // Insert new tokens
          const { error: insertError } = await supabase
            .from('user_tokens')
            .insert({
              user_id: userId,
              access_token: providerToken,
              refresh_token: providerRefreshToken,
              token_expiry: expiryDate.toISOString(),
            })

          if (insertError) {
            console.error('Error storing user tokens:', insertError)
          }
        }
      }

      // Successful authentication - redirect to dashboard
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    } catch (error) {
      console.error('Auth callback exception:', error)
      return NextResponse.redirect(
        new URL('/login?error=authentication_failed', requestUrl.origin)
      )
    }
  }

  // No code present - redirect to login
  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}
