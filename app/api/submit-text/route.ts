import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

/**
 * POST /api/submit-text
 * Handles text-based form submissions (text inputs, URLs, code snippets)
 * Uses admin client to bypass RLS for anonymous client submissions
 * Request body (JSON):
 *   - projectId: ID of the project
 *   - textResponses: Array of text response objects
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient()

    // Parse request body
    const body = await request.json()
    const { projectId, textResponses } = body

    // Validate required fields
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    if (!textResponses || !Array.isArray(textResponses) || textResponses.length === 0) {
      return NextResponse.json(
        { error: 'No text responses provided' },
        { status: 400 }
      )
    }

    console.log('📝 Received text responses:', textResponses.length)

    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      console.error('Project error:', projectError)
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Insert text responses as assets
    const { data: assets, error: assetError } = await supabase
      .from('assets')
      .insert(textResponses)
      .select()

    if (assetError) {
      console.error('❌ Error inserting text responses:', assetError)
      return NextResponse.json(
        {
          error: 'Failed to save text responses',
          details: assetError.message
        },
        { status: 500 }
      )
    }

    console.log('✅ Text responses saved:', assets?.length)

    // Create activity log entry
    await supabase
      .from('activity_log')
      .insert({
        project_id: projectId,
        action_type: 'asset_uploaded',
        action_details: {
          text_responses_count: textResponses.length,
          field_types: textResponses.map(r => r.metadata?.field_type)
        }
      })

    // Return success
    return NextResponse.json({
      success: true,
      count: assets?.length || 0,
      assets: assets
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Error in submit-text API:', error)
    return NextResponse.json(
      {
        error: 'Failed to process text responses',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
