import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Public routes that don't require authentication
  const publicRoutes = ['/collect', '/login', '/api/auth', '/api/upload', '/api/submit-text']
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))

  // Skip auth check entirely for public routes to avoid unnecessary Supabase calls
  if (isPublicRoute) {
    return supabaseResponse
  }

  // Check if Supabase is configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Supabase environment variables are not configured')
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Try to get user, but don't fail the entire request if it errors
  let user = null
  let authFailed = false

  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Auth timeout')), 3000)
    )

    const authPromise = supabase.auth.getUser()

    const { data, error } = await Promise.race([authPromise, timeoutPromise]) as any

    if (!error && data?.user) {
      user = data.user
    } else if (error) {
      authFailed = true
      console.warn('Auth error in middleware:', error.message)
    }
  } catch (error: any) {
    authFailed = true
    // Network or timeout errors - log but continue
    console.error('Failed to fetch user in middleware:', error?.message || error)

    // Clear potentially corrupted auth cookies on network failures
    const authCookies = [
      'sb-access-token',
      'sb-refresh-token',
      'sb-auth-token'
    ]
    authCookies.forEach(cookieName => {
      if (request.cookies.has(cookieName)) {
        supabaseResponse.cookies.delete(cookieName)
      }
    })
  }

  // Only protect dashboard routes
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    // If auth failed due to network issues, show a better error or allow through in dev mode
    if (authFailed && process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Auth failed but allowing through in development mode')
      console.warn('⚠️  Check your Supabase connection and environment variables')
      // In development, allow through with a warning rather than blocking
      return supabaseResponse
    }

    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect logged-in users away from login
  if (user && request.nextUrl.pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
