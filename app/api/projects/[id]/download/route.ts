import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getDownloadUrl } from '@/lib/google-drive/api'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/projects/[id]/download?fileId=xxx
 * Gets download URL for a file from Google Drive
 * Query parameters:
 *   - fileId: Google Drive file ID (required)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { id: projectId } = await params
    const searchParams = request.nextUrl.searchParams
    const fileId = searchParams.get('fileId')

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    // Validate required parameters
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }

    // Verify project exists and user has access
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, user_id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    // Verify the file belongs to this project
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select('id, file_name, google_drive_file_id')
      .eq('project_id', projectId)
      .eq('google_drive_file_id', fileId)
      .single()

    if (assetError || !asset) {
      return NextResponse.json(
        { error: 'File not found in this project' },
        { status: 404 }
      )
    }

    // Get user tokens from database
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_tokens')
      .select('access_token, refresh_token, token_expiry')
      .eq('user_id', user.id)
      .maybeSingle()

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Google Drive not connected. Please authorize first.' },
        { status: 404 }
      )
    }

    // Get download URL from Google Drive
    const downloadUrl = await getDownloadUrl(
      tokenData.access_token,
      tokenData.refresh_token,
      fileId,
      user.id,
      supabase,
      tokenData.token_expiry
    )

    if (!downloadUrl) {
      throw new Error('Failed to get download URL')
    }

    // Log download activity
    await supabase
      .from('activity_log')
      .insert({
        project_id: projectId,
        user_id: user.id,
        action_type: 'asset_downloaded',
        action_details: {
          asset_id: asset.id,
          file_name: asset.file_name,
          google_drive_file_id: fileId
        }
      })

    // Return download URL (or redirect to it)
    return NextResponse.json({
      success: true,
      downloadUrl: downloadUrl,
      file_name: asset.file_name
    }, { status: 200 })

    // Alternative: Redirect directly to the download URL
    // return NextResponse.redirect(downloadUrl)
  } catch (error) {
    console.error('Error getting download URL:', error)
    return NextResponse.json(
      {
        error: 'Failed to get download URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
