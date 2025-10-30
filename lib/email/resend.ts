import { Resend } from 'resend'

// Initialize Resend client
// IMPORTANT: RESEND_API_KEY must be set in your environment variables
// Get your API key from: https://resend.com/api-keys
if (!process.env.RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY environment variable is not set!')
  console.error('📝 Get your API key from: https://resend.com/api-keys')
  console.error('⚙️  Add it to your Vercel environment variables')
}

const resend = new Resend(process.env.RESEND_API_KEY || '')

export { resend }
