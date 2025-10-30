"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Mail, ArrowLeft, Sparkles, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [connectionError, setConnectionError] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  // Check Supabase connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Simple health check
        const { error } = await supabase.auth.getSession()
        if (error && error.message.includes('fetch')) {
          setConnectionError(true)
          console.error('Supabase connection error:', error)
        }
      } catch (err) {
        setConnectionError(true)
        console.error('Failed to connect to Supabase:', err)
      }
    }

    checkConnection()
  }, [])

  // Listen for auth state changes when email is sent
  useEffect(() => {
    if (!emailSent) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        console.log('✅ User successfully logged in from another tab')
        setLoggedIn(true)
      }
    })

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailSent])

  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })

      if (error) {
        throw error
      }

      setEmailSent(true)
      toast({
        title: "Check your email",
        description: "We've sent you a magic link to sign in",
      })
    } catch (error: any) {
      console.error('Magic link error:', error)

      // Provide more helpful error messages
      let errorMessage = "Failed to send magic link"

      if (error.message?.includes('fetch failed') || error.message?.includes('Failed to fetch')) {
        errorMessage = "Cannot connect to authentication service. Please check your internet connection and try again."
        setConnectionError(true)
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }


  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="p-8 text-center">
            {loggedIn ? (
              // Show success message when logged in from another tab
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2 text-slate-900">Successfully Logged In!</h2>
                <p className="text-slate-600 mb-6">
                  You have successfully logged in to your account.
                </p>
                <p className="text-sm text-slate-500 mb-6">
                  You can close this tab now and continue using the application in the other tab.
                </p>
                <Button
                  onClick={() => window.close()}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Close This Tab
                </Button>
              </>
            ) : (
              // Show "Check your email" message
              <>
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-slate-900">Check your email</h2>
                <p className="text-slate-600 mb-6">
                  We&apos;ve sent a magic link to <strong>{email}</strong>
                </p>
                <p className="text-sm text-slate-500 mb-6">
                  Click the link in the email to sign in. The link will expire in 1 hour.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setEmailSent(false)}
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Back to login
                </Button>
              </>
            )}
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Connection Error Alert */}
        {connectionError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <Card className="p-4 bg-red-50 border-red-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 text-sm">Connection Issue</h3>
                  <p className="text-red-700 text-sm mt-1">
                    Unable to connect to Supabase. Please check:
                  </p>
                  <ul className="text-red-700 text-xs mt-2 space-y-1 list-disc list-inside">
                    <li>Your internet connection</li>
                    <li>Supabase environment variables in .env.local</li>
                    <li>Supabase project is not paused</li>
                  </ul>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="mt-3 text-xs border-red-300 text-red-700 hover:bg-red-100"
                  >
                    Retry Connection
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to home
          </Button>

          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AssetDrop
            </span>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h1>
          <p className="text-slate-600">Sign in to your account to continue</p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-8">
            <form onSubmit={handleMagicLinkSignIn} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Sending magic link...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 w-4 h-4" />
                    Continue with Email
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-600">
              <p>
                By signing in, you agree to our{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  Privacy Policy
                </a>
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-center text-sm text-slate-600"
        >
          <p>No account yet? Sign up is automatic when you sign in.</p>
        </motion.div>
      </div>
    </div>
  )
}
