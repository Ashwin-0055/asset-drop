import { google } from 'googleapis'
import { getOAuth2Client, refreshAccessToken } from './oauth'
import { Readable } from 'stream'
import type { SupabaseClient } from '@supabase/supabase-js'

interface GetDriveClientOptions {
  accessToken: string
  refreshToken: string
  userId?: string
  supabase?: SupabaseClient
}

export async function getDriveClient(
  accessToken: string,
  refreshToken: string,
  userId?: string,
  supabase?: SupabaseClient,
  tokenExpiry?: string | null
) {
  const oauth2Client = getOAuth2Client()

  // Check if token is expired and needs manual refresh BEFORE using it
  const isExpired = tokenExpiry ? new Date(tokenExpiry) < new Date() : false
  let currentAccessToken = accessToken

  if (isExpired) {
    console.log('🔄 Token expired, manually refreshing before request...')

    try {
      const newTokens = await refreshAccessToken(refreshToken)
      currentAccessToken = newTokens.access_token!

      // Save the new token to database immediately
      if (userId && supabase) {
        const expiryDate = new Date(Date.now() + (newTokens.expiry_date || 3600 * 1000))

        await supabase
          .from('user_tokens')
          .update({
            access_token: currentAccessToken,
            token_expiry: expiryDate.toISOString(),
          })
          .eq('user_id', userId)

        console.log('✅ Token refreshed and saved to database')
      }
    } catch (error) {
      console.error('⚠️  Failed to refresh token:', error)
      throw error
    }
  }

  // Set credentials with the current (possibly refreshed) token
  oauth2Client.setCredentials({
    access_token: currentAccessToken,
    refresh_token: refreshToken,
  })

  // Set up automatic token refresh for edge cases
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      console.log('📝 New access token received (auto-refresh)')

      // Update the database with new token if userId and supabase are provided
      if (userId && supabase && tokens.access_token) {
        try {
          const expiryDate = new Date(Date.now() + (tokens.expiry_date || 3600 * 1000))

          await supabase
            .from('user_tokens')
            .update({
              access_token: tokens.access_token,
              token_expiry: expiryDate.toISOString(),
            })
            .eq('user_id', userId)

          console.log('✅ Updated access token in database')
        } catch (error) {
          console.error('⚠️  Failed to update token in database:', error)
          // Continue anyway - the token is still valid for this request
        }
      }
    }
  })

  return google.drive({ version: 'v3', auth: oauth2Client })
}

export async function createFolder(
  accessToken: string,
  refreshToken: string,
  folderName: string,
  parentFolderId?: string,
  userId?: string,
  supabase?: SupabaseClient,
  tokenExpiry?: string | null
) {
  const drive = await getDriveClient(accessToken, refreshToken, userId, supabase, tokenExpiry)

  const fileMetadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  }

  if (parentFolderId) {
    fileMetadata.parents = [parentFolderId]
  }

  const folder = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id, name',
  })

  return folder.data
}

export async function uploadFile(
  accessToken: string,
  refreshToken: string,
  fileName: string,
  mimeType: string,
  fileBuffer: Buffer,
  folderId?: string,
  userId?: string,
  supabase?: SupabaseClient,
  tokenExpiry?: string | null
) {
  const drive = await getDriveClient(accessToken, refreshToken, userId, supabase, tokenExpiry)

  const fileMetadata: any = {
    name: fileName,
  }

  if (folderId) {
    fileMetadata.parents = [folderId]
  }

  const media = {
    mimeType,
    body: Readable.from(fileBuffer),
  }

  const file = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id, name, mimeType, size, webViewLink, webContentLink',
  })

  return file.data
}

export async function getFile(
  accessToken: string,
  refreshToken: string,
  fileId: string,
  userId?: string,
  supabase?: SupabaseClient,
  tokenExpiry?: string | null
) {
  const drive = await getDriveClient(accessToken, refreshToken, userId, supabase, tokenExpiry)

  const file = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size, webViewLink, webContentLink, thumbnailLink',
  })

  return file.data
}

export async function deleteFile(
  accessToken: string,
  refreshToken: string,
  fileId: string,
  userId?: string,
  supabase?: SupabaseClient,
  tokenExpiry?: string | null
) {
  const drive = await getDriveClient(accessToken, refreshToken, userId, supabase, tokenExpiry)
  await drive.files.delete({ fileId })
}

export async function getDownloadUrl(
  accessToken: string,
  refreshToken: string,
  fileId: string,
  userId?: string,
  supabase?: SupabaseClient,
  tokenExpiry?: string | null
) {
  const drive = await getDriveClient(accessToken, refreshToken, userId, supabase, tokenExpiry)

  const file = await drive.files.get({
    fileId,
    fields: 'webContentLink, webViewLink',
  })

  return file.data.webContentLink || file.data.webViewLink
}

export async function ensureAssetDropFolder(
  accessToken: string,
  refreshToken: string,
  userId?: string,
  supabase?: SupabaseClient,
  tokenExpiry?: string | null
) {
  const drive = await getDriveClient(accessToken, refreshToken, userId, supabase, tokenExpiry)

  // Search for existing AssetDrop folder
  const response = await drive.files.list({
    q: "name='AssetDrop' and mimeType='application/vnd.google-apps.folder' and trashed=false",
    spaces: 'drive',
    fields: 'files(id, name)',
  })

  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0].id!
  }

  // Create AssetDrop folder if it doesn't exist
  const folder = await createFolder(accessToken, refreshToken, 'AssetDrop', undefined, userId, supabase, tokenExpiry)
  return folder.id!
}
