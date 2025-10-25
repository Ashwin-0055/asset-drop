'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, AuthError } from '@supabase/supabase-js'

interface UseAuthReturn {
  user: User | null
  loading: boolean
  signInWithEmail: (email: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error getting session:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const signInWithEmail = async (email: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        return { error }
      }

      return { error: null }
    } catch (error) {
      console.error('Error signing in:', error)
      return {
        error: {
          message: 'An unexpected error occurred during sign in',
          name: 'SignInError',
          status: 500
        } as AuthError
      }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()

      if (error) {
        return { error }
      }

      setUser(null)
      return { error: null }
    } catch (error) {
      console.error('Error signing out:', error)
      return {
        error: {
          message: 'An unexpected error occurred during sign out',
          name: 'SignOutError',
          status: 500
        } as AuthError
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    loading,
    signInWithEmail,
    signOut,
  }
}
