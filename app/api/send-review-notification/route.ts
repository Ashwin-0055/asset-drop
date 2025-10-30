import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { resend } from '@/lib/email/resend'
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

    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY is not configured')
      console.error('📝 Set RESEND_API_KEY in your Vercel environment variables')
      console.error('🔗 Get your API key from: https://resend.com/api-keys')
      return NextResponse.json(
        {
          error: 'Email service not configured',
          details: 'RESEND_API_KEY environment variable is missing. Please configure it in your Vercel project settings.'
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

    // Send email via Resend
    console.log('📤 Sending email via Resend...')

    // NOTE: Using onboarding@resend.dev for testing
    // ⚠️  IMPORTANT: This only works with your registered Resend email address
    // To send to ANY email address:
    //   1. Verify a domain at https://resend.com/domains
    //   2. Replace 'onboarding@resend.dev' with 'noreply@yourdomain.com'
    //   3. Example: from: 'AssetDrop <noreply@assetdrop.com>'
    const emailResult = await resend.emails.send({
      from: 'AssetDrop <onboarding@resend.dev>',
      to: clientEmail,
      subject: `Asset Review Complete - ${project.name}`,
      html: htmlContent,
      text: textContent
    })

    if (emailResult.error) {
      console.error('❌ Resend API Error Details:')
      console.error('   Full error object:', JSON.stringify(emailResult.error, null, 2))
      console.error('   Error type:', typeof emailResult.error)
      console.error('   Error name:', emailResult.error?.name)
      console.error('   Error message:', emailResult.error?.message)

      // Provide specific error messages for common issues
      let userMessage = 'Failed to send email via Resend'
      const errorMsg = (emailResult.error?.message || '').toLowerCase()

      // Check for specific Resend API errors
      if (errorMsg.includes('verify a domain') || errorMsg.includes('testing emails')) {
        userMessage = 'Domain verification required: Resend only allows sending to your registered email in testing mode. Please verify a domain at resend.com/domains to send to any email address.'
        console.error('🚫 Resend Domain Restriction:')
        console.error('   You can only send to your own email address until you verify a domain')
        console.error('📝 Steps to fix:')
        console.error('   1. Go to https://resend.com/domains')
        console.error('   2. Add and verify your domain')
        console.error('   3. Update the "from" email in the code to use your domain')
      } else if (errorMsg.includes('api') && (errorMsg.includes('key') || errorMsg.includes('token') || errorMsg.includes('auth'))) {
        userMessage = 'Email service authentication failed. RESEND_API_KEY is missing or invalid.'
        console.error('💡 Action required: Set a valid RESEND_API_KEY in Vercel environment variables')
        console.error('🔗 Get your API key from: https://resend.com/api-keys')
      } else if (errorMsg.includes('rate') && errorMsg.includes('limit')) {
        userMessage = 'Email rate limit exceeded. Please try again in a few minutes.'
      } else if (errorMsg.includes('recipient') || errorMsg.includes('to address')) {
        userMessage = `Invalid recipient email address: ${clientEmail}`
      } else if (errorMsg.includes('from address') || errorMsg.includes('sender')) {
        userMessage = 'Invalid sender email. Using onboarding@resend.dev which should work in testing.'
      } else {
        // For any other error, show the actual Resend error message
        userMessage = `Resend API error: ${emailResult.error?.message || 'Unknown error'}`
      }

      return NextResponse.json(
        {
          error: userMessage,
          details: emailResult.error,
          resendErrorMessage: emailResult.error?.message
        },
        { status: 500 }
      )
    }

    console.log('✅ Email sent successfully!')
    console.log('📬 Email ID:', emailResult.data?.id)
    console.log('📨 Sent to:', clientEmail)
    console.log('📊 Summary: Approved:', approved.length, 'Rejected:', rejected.length)

    // Log activity
    await supabase.from('activity_log').insert({
      project_id: projectId,
      action_type: 'review_notification_sent',
      action_details: {
        client_email: clientEmail,
        approved_count: approved.length,
        rejected_count: rejected.length,
        email_id: emailResult.data?.id
      }
    })

    return NextResponse.json({
      success: true,
      emailId: emailResult.data?.id,
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
