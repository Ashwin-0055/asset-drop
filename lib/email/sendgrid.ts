import sendgrid from '@sendgrid/mail'

// Initialize SendGrid client
// IMPORTANT: SENDGRID_API_KEY must be set in your environment variables
// Get your API key from: https://app.sendgrid.com/settings/api_keys
if (!process.env.SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY environment variable is not set!')
  console.error('📝 Get your API key from: https://app.sendgrid.com/settings/api_keys')
  console.error('⚙️  Add it to your Vercel environment variables')
} else {
  sendgrid.setApiKey(process.env.SENDGRID_API_KEY)
}

export { sendgrid }
