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

    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY is not configured')
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    const { clientEmail, projectId } = await request.json()

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

    const emailResult = await resend.emails.send({
      from: 'AssetDrop <onboarding@resend.dev>',
      to: clientEmail,
      subject: `Asset Review Complete - ${project.name}`,
      html: htmlContent,
      text: textContent
    })

    if (emailResult.error) {
      console.error('❌ Resend error:', emailResult.error)
      return NextResponse.json(
        { error: 'Failed to send email', details: emailResult.error },
        { status: 500 }
      )
    }

    console.log('✅ Email sent successfully! ID:', emailResult.data?.id)

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
    return NextResponse.json(
      {
        error: 'Failed to send notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
