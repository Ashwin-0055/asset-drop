import { google } from 'googleapis'

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.profile',
]

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
  )
}

export function getAuthUrl() {
  const oauth2Client = getOAuth2Client()
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  })
}

export async function getTokensFromCode(code: string) {
  const oauth2Client = getOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

export async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({ refresh_token: refreshToken })

  try {
    const { credentials } = await oauth2Client.refreshAccessToken()
    return credentials
  } catch (error: any) {
    console.error('Error refreshing access token:', error)

    // Check if the error is invalid_grant (token revoked or expired)
    if (error.message?.includes('invalid_grant')) {
      const tokenError = new Error('Google Drive access has been revoked. Please reconnect.')
      ;(tokenError as any).code = 'INVALID_GRANT'
      throw tokenError
    }

    throw new Error('Failed to refresh access token: ' + (error.message || 'Unknown error'))
  }
}
