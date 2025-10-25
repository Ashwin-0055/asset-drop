import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { uploadFile, createFolder, ensureAssetDropFolder } from '@/lib/google-drive/api'

/**
 * POST /api/upload
 * Handles file uploads to Google Drive and creates asset records
 * Uses admin client to bypass RLS for anonymous client submissions
 * Request body (FormData):
 *   - file: File to upload
 *   - projectId: ID of the project
 *   - formFieldId: ID of the form field (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient()

    // Parse form data first
    const formData = await request.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('projectId') as string
    const formFieldId = formData.get('formFieldId') as string | null

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('name, google_drive_folder_id, user_id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Get project owner's tokens (not the client's - clients are anonymous)
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_tokens')
      .select('access_token, refresh_token, token_expiry')
      .eq('user_id', project.user_id)
      .maybeSingle()

    if (tokenError || !tokenData) {
      console.error('Token fetch error:', tokenError)
      return NextResponse.json(
        { error: 'Google Drive not connected. Project owner needs to authorize Google Drive.' },
        { status: 403 }
      )
    }

    // Check if token is expired and needs refresh
    const tokenExpiry = tokenData.token_expiry ? new Date(tokenData.token_expiry) : null
    const isExpired = tokenExpiry && tokenExpiry < new Date()

    if (isExpired) {
      console.log('🔄 Token expired, will be auto-refreshed by googleapis')
    }

    console.log('✅ Using tokens for user:', project.user_id)
    console.log('📅 Token expires:', tokenExpiry?.toISOString())

    // Ensure AssetDrop root folder exists
    const assetDropFolderId = await ensureAssetDropFolder(
      tokenData.access_token,
      tokenData.refresh_token,
      project.user_id,
      supabase,
      tokenData.token_expiry
    )

    // Create or get project folder
    let projectFolderId = project.google_drive_folder_id

    if (!projectFolderId) {
      const projectFolder = await createFolder(
        tokenData.access_token,
        tokenData.refresh_token,
        project.name,
        assetDropFolderId,
        project.user_id,
        supabase,
        tokenData.token_expiry
      )
      projectFolderId = projectFolder.id!

      // Update project with folder ID
      await supabase
        .from('projects')
        .update({ google_drive_folder_id: projectFolderId })
        .eq('id', projectId)
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    // Upload file to Google Drive
    const uploadedFile = await uploadFile(
      tokenData.access_token,
      tokenData.refresh_token,
      file.name,
      file.type,
      fileBuffer,
      projectFolderId,
      project.user_id,
      supabase,
      tokenData.token_expiry
    )

    if (!uploadedFile.id) {
      throw new Error('Failed to upload file to Google Drive')
    }

    // Create asset record in database
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .insert({
        project_id: projectId,
        form_field_id: formFieldId,
        file_name: file.name,
        file_type: file.type,
        file_size: Number(uploadedFile.size) || file.size,
        google_drive_file_id: uploadedFile.id, // Match schema column name
        uploaded_by: 'client', // Anonymous upload from client portal
        status: 'pending'
      })
      .select()
      .single()

    if (assetError) {
      console.error('Error creating asset record:', assetError)
      throw new Error('Failed to create asset record')
    }

    // Create activity log entry
    await supabase
      .from('activity_log')
      .insert({
        project_id: projectId,
        action_type: 'asset_uploaded',
        action_details: {
          asset_id: asset.id,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size
        }
      })

    // Return asset data
    return NextResponse.json({
      success: true,
      asset: {
        id: asset.id,
        file_name: asset.file_name,
        file_type: asset.file_type,
        file_size: asset.file_size,
        google_drive_file_id: uploadedFile.id,
        created_at: asset.created_at
      }
    }, { status: 200 })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      {
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
