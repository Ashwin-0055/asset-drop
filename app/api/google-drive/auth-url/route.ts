import { NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/google-drive/oauth'

/**
 * GET /api/google-drive/auth-url
 * Returns Google OAuth authorization URL for initiating the OAuth flow
 */
export async function GET() {
  try {
    const authUrl = getAuthUrl()

    return NextResponse.json({
      url: authUrl
    }, { status: 200 })
  } catch (error) {
    console.error('Error generating auth URL:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate authorization URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
