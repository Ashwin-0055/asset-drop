import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { deleteFile } from '@/lib/google-drive/api'

/**
 * DELETE /api/google-drive/delete-folder
 * Deletes a folder from Google Drive (including all contents)
 * Request body: { folderId: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const { folderId } = await request.json()

    if (!folderId) {
      return NextResponse.json(
        { error: 'Folder ID is required' },
        { status: 400 }
      )
    }

    // Get user's Google Drive tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_tokens')
      .select('access_token, refresh_token, token_expiry')
      .eq('user_id', user.id)
      .maybeSingle()

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Google Drive not connected' },
        { status: 404 }
      )
    }

    // Delete the folder from Drive (this also deletes all contents and auto-saves refreshed tokens)
    // Note: In Google Drive API, folders are also files, so we use deleteFile
    await deleteFile(
      tokenData.access_token,
      tokenData.refresh_token,
      folderId,
      user.id,
      supabase,
      tokenData.token_expiry
    )

    console.log(`✅ Deleted folder from Drive: ${folderId}`)

    return NextResponse.json(
      { success: true, message: 'Folder deleted from Google Drive' },
      { status: 200 }
    )

  } catch (error: any) {
    console.error('Error deleting folder from Drive:', error)

    // Handle specific errors
    if (error.code === 404) {
      return NextResponse.json(
        { error: 'Folder not found in Google Drive', success: false },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to delete folder from Google Drive',
        details: error.message
      },
      { status: 500 }
    )
  }
}
