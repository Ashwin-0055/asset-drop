import { Resend } from 'resend'

// Initialize Resend client
// Use a dummy key during build time if not configured
// This prevents build failures on Vercel when env vars aren't set yet
const resend = new Resend(process.env.RESEND_API_KEY || 'dummy_key_for_build')

export { resend }
