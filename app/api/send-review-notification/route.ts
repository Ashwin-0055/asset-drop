import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { sendgrid } from '@/lib/email/sendgrid'
import { generateAssetReviewEmailHTML, generateAssetReviewEmailText } from '@/lib/email/templates'

/**
 * POST /api/send-review-notification
 * Sends email notification to client about asset review results
 * Request body:
 *   - clientEmail: Email address of the client
 *   - projectId: ID of the project
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📧 Processing review notification request...')
    console.log('⏰ Timestamp:', new Date().toISOString())

    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
      console.error('❌ SENDGRID_API_KEY is not configured')
      console.error('📝 Set SENDGRID_API_KEY in your Vercel environment variables')
      console.error('🔗 Get your API key from: https://app.sendgrid.com/settings/api_keys')
      return NextResponse.json(
        {
          error: 'Email service not configured',
          details: 'SENDGRID_API_KEY environment variable is missing. Please configure it in your Vercel project settings.'
        },
        { status: 500 }
      )
    }

    // Check if sender email is configured
    if (!process.env.SENDGRID_FROM_EMAIL) {
      console.error('❌ SENDGRID_FROM_EMAIL is not configured')
      console.error('📝 Set SENDGRID_FROM_EMAIL in your Vercel environment variables')
      console.error('💡 Example: noreply@yourdomain.com or your@email.com')
      return NextResponse.json(
        {
          error: 'Sender email not configured',
          details: 'SENDGRID_FROM_EMAIL environment variable is missing. This should be a verified sender email in SendGrid.'
        },
        { status: 500 }
      )
    }

    const { clientEmail, projectId } = await request.json()

    console.log('📋 Request params:', { clientEmail, projectId })

    if (!clientEmail || !projectId) {
      return NextResponse.json(
        { error: 'Client email and project ID are required' },
        { status: 400 }
      )
    }

    console.log(`📬 Preparing notification for ${clientEmail} (Project: ${projectId})`)

    const supabase = createAdminSupabaseClient()

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('name, shareable_link_id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      console.error('❌ Project not found:', projectError)
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Get all assets for this client in this project
    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .select('*')
      .eq('project_id', projectId)
      .eq('client_email', clientEmail)
      .order('created_at', { ascending: false })

    if (assetsError) {
      console.error('❌ Error fetching assets:', assetsError)
      return NextResponse.json(
        { error: 'Failed to fetch assets' },
        { status: 500 }
      )
    }

    if (!assets || assets.length === 0) {
      console.warn('⚠️  No assets found for this client')
      return NextResponse.json(
        { error: 'No assets found for this client' },
        { status: 404 }
      )
    }

    // Separate approved and rejected assets
    const approved = assets
      .filter(a => a.status === 'approved')
      .map(a => ({
        fileName: a.file_name,
        remark: a.approval_remark
      }))

    const rejected = assets
      .filter(a => a.status === 'rejected')
      .map(a => ({
        fileName: a.file_name,
        reason: a.rejection_reason
      }))

    // Only send email if there are reviewed assets (approved or rejected)
    if (approved.length === 0 && rejected.length === 0) {
      console.warn('⚠️  No reviewed assets found')
      return NextResponse.json(
        { error: 'No reviewed assets found. All assets are still pending.' },
        { status: 400 }
      )
    }

    console.log(`✅ Found ${approved.length} approved, ${rejected.length} rejected`)

    // Generate shareable link
    const shareableLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/collect/${project.shareable_link_id}`

    // Prepare email data
    const emailData = {
      projectName: project.name,
      projectId,
      shareableLink,
      approved,
      rejected
    }

    // Generate email content
    const htmlContent = generateAssetReviewEmailHTML(emailData)
    const textContent = generateAssetReviewEmailText(emailData)

    // Send email via SendGrid
    console.log('📤 Sending email via SendGrid...')

    // NOTE: Sender email must be verified in SendGrid
    // ⚠️  IMPORTANT: You need to verify a sender email in SendGrid:
    //   1. Go to https://app.sendgrid.com/settings/sender_auth/senders
    //   2. Add and verify your email (e.g., hustlerashwin2400@gmail.com)
    //   3. Set SENDGRID_FROM_EMAIL environment variable to that email
    //   OR verify a domain for professional emails (noreply@yourdomain.com)

    const fromEmail = process.env.SENDGRID_FROM_EMAIL
    const fromName = process.env.SENDGRID_FROM_NAME || 'AssetDrop'

    try {
      await sendgrid.send({
        to: clientEmail,
        from: {
          email: fromEmail!,
          name: fromName
        },
        subject: `Asset Review Complete - ${project.name}`,
        html: htmlContent,
        text: textContent
      })

      console.log('✅ Email sent successfully via SendGrid!')
      console.log('📨 Sent to:', clientEmail)
      console.log('📧 From:', `${fromName} <${fromEmail}>`)
      console.log('📊 Summary: Approved:', approved.length, 'Rejected:', rejected.length)

    } catch (error: any) {
      console.error('❌ SendGrid API Error Details:')
      console.error('   Full error object:', JSON.stringify(error, null, 2))
      console.error('   Error type:', typeof error)
      console.error('   Error code:', error.code)
      console.error('   Error message:', error.message)
      console.error('   Response body:', error.response?.body)

      // Provide specific error messages for common issues
      let userMessage = 'Failed to send email via SendGrid'
      const errorMsg = error.message || error.toString() || ''
      const errorCode = error.code

      // Check for specific SendGrid API errors
      if (errorMsg.toLowerCase().includes('not verified') || errorMsg.toLowerCase().includes('sender identity')) {
        userMessage = 'Sender email not verified: You need to verify your sender email in SendGrid. Go to SendGrid Settings → Sender Authentication → Single Sender Verification and verify your email address.'
        console.error('🚫 SendGrid Sender Verification Required:')
        console.error('   Your sender email is not verified in SendGrid')
        console.error('📝 Steps to fix:')
        console.error('   1. Go to https://app.sendgrid.com/settings/sender_auth/senders')
        console.error('   2. Click "Create New Sender" or "Verify Single Sender"')
        console.error('   3. Add your email (e.g., hustlerashwin2400@gmail.com)')
        console.error('   4. Check your inbox and click verification link')
        console.error('   5. Set SENDGRID_FROM_EMAIL=your@email.com in Vercel')
      } else if (errorMsg.toLowerCase().includes('api') && (errorMsg.toLowerCase().includes('key') || errorMsg.toLowerCase().includes('unauthorized'))) {
        userMessage = 'Email service authentication failed. SENDGRID_API_KEY is missing or invalid.'
        console.error('💡 Action required: Set a valid SENDGRID_API_KEY in Vercel environment variables')
        console.error('🔗 Get your API key from: https://app.sendgrid.com/settings/api_keys')
      } else if (errorMsg.toLowerCase().includes('rate limit') || errorCode === 429) {
        userMessage = 'Email rate limit exceeded. Please try again in a few minutes.'
      } else if (errorMsg.toLowerCase().includes('invalid email') || errorMsg.toLowerCase().includes('malformed')) {
        userMessage = `Invalid email address: ${clientEmail}`
      } else {
        // For any other error, show the actual SendGrid error message
        userMessage = `SendGrid API error: ${errorMsg || 'Unknown error'}`
      }

      return NextResponse.json(
        {
          error: userMessage,
          details: error.response?.body || error,
          sendgridErrorMessage: errorMsg
        },
        { status: 500 }
      )
    }

    // Log activity
    await supabase.from('activity_log').insert({
      project_id: projectId,
      action_type: 'review_notification_sent',
      action_details: {
        client_email: clientEmail,
        approved_count: approved.length,
        rejected_count: rejected.length,
        service: 'sendgrid'
      }
    })

    return NextResponse.json({
      success: true,
      service: 'sendgrid',
      summary: {
        approved: approved.length,
        rejected: rejected.length
      }
    })

  } catch (error) {
    console.error('❌ Error sending review notification:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('❌ Error type:', typeof error)

    // Provide more detailed error information
    let errorMessage = 'Failed to send notification'
    let errorDetails = 'Unknown error'

    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = error.stack || error.message
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    )
  }
}
