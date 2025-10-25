import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { deleteFile } from '@/lib/google-drive/api'

/**
 * DELETE /api/google-drive/delete-file
 * Deletes a file from Google Drive
 * Request body: { fileId: string }
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
    const { fileId } = await request.json()

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
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

    // Delete the file from Drive (this will auto-save refreshed tokens)
    await deleteFile(
      tokenData.access_token,
      tokenData.refresh_token,
      fileId,
      user.id,
      supabase,
      tokenData.token_expiry
    )

    console.log(`✅ Deleted file from Drive: ${fileId}`)

    return NextResponse.json(
      { success: true, message: 'File deleted from Google Drive' },
      { status: 200 }
    )

  } catch (error: any) {
    console.error('Error deleting file from Drive:', error)

    // Handle specific errors
    if (error.code === 404) {
      return NextResponse.json(
        { error: 'File not found in Google Drive', success: false },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to delete file from Google Drive',
        details: error.message
      },
      { status: 500 }
    )
  }
}
