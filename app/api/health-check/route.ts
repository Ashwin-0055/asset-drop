import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { sendgrid } from '@/lib/email/sendgrid'

/**
 * Health Check API Route
 *
 * Keeps services active by:
 * 1. Pinging Supabase database (prevents 7-day inactivity pause)
 * 2. Sending monthly test email via SendGrid (prevents account deactivation)
 *
 * Called automatically by Vercel Cron Jobs every 5 days
 * Can also be called manually for testing
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const results: any = {
    timestamp: new Date().toISOString(),
    services: {},
    success: true
  }

  // Verify secret token (prevents unauthorized access)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // 1. Check Supabase Connection
  try {
    const supabase = createAdminSupabaseClient()

    // Simple query to keep database active
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    if (error) throw error

    results.services.supabase = {
      status: 'healthy',
      message: 'Database connection successful',
      responseTime: Date.now() - startTime
    }

    console.log('✅ Supabase health check passed')
  } catch (error: any) {
    console.error('❌ Supabase health check failed:', error)
    results.services.supabase = {
      status: 'error',
      message: error.message,
      responseTime: Date.now() - startTime
    }
    results.success = false
  }

  // 2. Check SendGrid (send test email once per month)
  try {
    const lastEmailDate = await getLastHealthCheckEmailDate()
    const daysSinceLastEmail = lastEmailDate
      ? Math.floor((Date.now() - lastEmailDate.getTime()) / (1000 * 60 * 60 * 24))
      : 999

    // Only send test email if it's been 30+ days
    if (daysSinceLastEmail >= 30) {
      const fromEmail = process.env.SENDGRID_FROM_EMAIL
      const fromName = process.env.SENDGRID_FROM_NAME || 'AssetDrop'

      if (!fromEmail) {
        throw new Error('SENDGRID_FROM_EMAIL not configured')
      }

      await sendgrid.send({
        to: fromEmail, // Send to yourself
        from: {
          email: fromEmail,
          name: fromName
        },
        subject: '✅ AssetDrop Health Check - All Systems Active',
        text: `This is an automated health check email to keep your SendGrid account active.

AssetDrop Status Report:
- Date: ${new Date().toLocaleString()}
- Supabase: ${results.services.supabase?.status || 'unknown'}
- SendGrid: Active (this email proves it!)
- Google Drive API: Ready

No action required. Your services are running smoothly.

---
AssetDrop Automated Health Check
This email is sent once per month to prevent service inactivity.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4CAF50;">✅ AssetDrop Health Check</h2>
            <p>All systems are active and healthy!</p>

            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Status Report</h3>
              <ul style="list-style: none; padding: 0;">
                <li style="margin: 8px 0;">📅 <strong>Date:</strong> ${new Date().toLocaleString()}</li>
                <li style="margin: 8px 0;">🗄️ <strong>Supabase:</strong> ${results.services.supabase?.status || 'unknown'}</li>
                <li style="margin: 8px 0;">📧 <strong>SendGrid:</strong> Active ✓</li>
                <li style="margin: 8px 0;">☁️ <strong>Google Drive:</strong> Ready ✓</li>
              </ul>
            </div>

            <p style="color: #666; font-size: 14px;">
              <strong>No action required.</strong> This is an automated email sent once per month
              to keep your SendGrid account active and prevent inactivity deactivation.
            </p>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

            <p style="color: #999; font-size: 12px;">
              AssetDrop Automated Health Check<br>
              Need to disable? Update your Vercel cron configuration.
            </p>
          </div>
        `
      })

      // Store the email date
      await saveHealthCheckEmailDate()

      results.services.sendgrid = {
        status: 'healthy',
        message: 'Test email sent successfully',
        lastEmailSent: new Date().toISOString()
      }

      console.log('✅ SendGrid health check passed - Test email sent')
    } else {
      results.services.sendgrid = {
        status: 'healthy',
        message: `Skipped (last email sent ${daysSinceLastEmail} days ago)`,
        nextEmailIn: `${30 - daysSinceLastEmail} days`
      }

      console.log(`✅ SendGrid health check passed - Email not needed (sent ${daysSinceLastEmail} days ago)`)
    }
  } catch (error: any) {
    console.error('❌ SendGrid health check failed:', error)
    results.services.sendgrid = {
      status: 'error',
      message: error.message
    }
    results.success = false
  }

  // 3. Google Drive status (just informational, tokens refresh automatically)
  results.services.googleDrive = {
    status: 'info',
    message: 'OAuth tokens refresh automatically on use. Ensure consent screen is published (not Testing mode).'
  }

  // Calculate total response time
  results.totalTime = Date.now() - startTime

  console.log('🏥 Health check complete:', results)

  return NextResponse.json(results, {
    status: results.success ? 200 : 500
  })
}

/**
 * Get the date of the last health check email from Supabase
 */
async function getLastHealthCheckEmailDate(): Promise<Date | null> {
  try {
    const supabase = createAdminSupabaseClient()

    // Check if we have a health_check_logs table (create it if not exists is handled in migration)
    const { data, error } = await supabase
      .from('health_check_logs')
      .select('email_sent_at')
      .eq('check_type', 'sendgrid')
      .order('email_sent_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) return null

    return new Date(data.email_sent_at)
  } catch (error) {
    console.warn('Could not fetch last email date:', error)
    return null
  }
}

/**
 * Save the health check email date to Supabase
 */
async function saveHealthCheckEmailDate(): Promise<void> {
  try {
    const supabase = createAdminSupabaseClient()

    await supabase
      .from('health_check_logs')
      .insert({
        check_type: 'sendgrid',
        email_sent_at: new Date().toISOString()
      })
  } catch (error) {
    console.warn('Could not save email date:', error)
    // Non-critical error, don't throw
  }
}
