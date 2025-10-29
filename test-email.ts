/**
 * Quick test script to verify Resend API is working
 * Run with: npx tsx test-email.ts
 */

import { Resend } from 'resend'

const RESEND_API_KEY = 're_fFsg2xhu_My2cFeDmHMTvuLeHvrfdpoxY'
const resend = new Resend(RESEND_API_KEY)

async function testEmail() {
  console.log('🧪 Testing Resend API...')
  console.log('📧 Sending test email...')

  try {
    const result = await resend.emails.send({
      from: 'AssetDrop <onboarding@resend.dev>',
      to: 'hustlerashwin2400@gmail.com', // Your email
      subject: 'Test Email from AssetDrop',
      html: '<h1>Test Successful!</h1><p>If you received this, your Resend API is working correctly.</p>',
      text: 'Test Successful! If you received this, your Resend API is working correctly.'
    })

    console.log('\n📦 Full Result:', JSON.stringify(result, null, 2))

    if (result.error) {
      console.error('\n❌ Resend returned an error:', result.error)
    } else {
      console.log('\n✅ Email sent successfully!')
      console.log('📬 Email ID:', result.data?.id)
      console.log('🔗 Check your inbox at: hustlerashwin2400@gmail.com')
    }
  } catch (error: any) {
    console.error('❌ Failed to send email:', error)
    console.error('Error details:', error.message)

    if (error.message?.includes('API key')) {
      console.log('⚠️  Issue: API key might be invalid or not activated')
    }
  }
}

testEmail()
