import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/projects/[id]/assets
 * Fetches all assets for a specific project, grouped by form field
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { id: projectId } = await params

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    // Validate project ID
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, organization_id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check if user is a member of the organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', project.organization_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Access denied. You are not a member of this organization.' },
        { status: 403 }
      )
    }

    // Fetch all assets for the project
    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .select(`
        id,
        project_id,
        form_field_id,
        file_name,
        file_type,
        file_size,
        drive_file_id,
        drive_web_link,
        uploaded_by,
        created_at,
        updated_at,
        uploader:uploaded_by(id, email, raw_user_meta_data)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (assetsError) {
      console.error('Error fetching assets:', assetsError)
      throw new Error('Failed to fetch assets')
    }

    // Group assets by form_field_id
    const groupedAssets: Record<string, any[]> = {}
    const ungroupedAssets: any[] = []

    assets.forEach((asset) => {
      if (asset.form_field_id) {
        if (!groupedAssets[asset.form_field_id]) {
          groupedAssets[asset.form_field_id] = []
        }
        groupedAssets[asset.form_field_id].push(asset)
      } else {
        ungroupedAssets.push(asset)
      }
    })

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name
      },
      assets: {
        grouped: groupedAssets,
        ungrouped: ungroupedAssets,
        total: assets.length
      }
    }, { status: 200 })
  } catch (error) {
    console.error('Error fetching project assets:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch project assets',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
