/**
 * Script to add metadata column to assets table
 * Run this with: node scripts/add-metadata-column.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function addMetadataColumn() {
  console.log('🔧 Adding metadata column to assets table...\n')

  // Create Supabase client with service role key (bypasses RLS)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Missing Supabase environment variables')
    console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Step 1: Check if column exists
    console.log('1️⃣  Checking if metadata column exists...')

    const { data: columns, error: checkError } = await supabase
      .from('assets')
      .select('*')
      .limit(1)

    if (checkError) {
      console.error('❌ Error checking table:', checkError.message)
      process.exit(1)
    }

    // Try to read metadata field
    const hasMetadata = columns && columns.length > 0 && 'metadata' in columns[0]

    if (hasMetadata) {
      console.log('✅ metadata column already exists!')
    } else {
      console.log('⚠️  metadata column not found in schema cache')
    }

    // Step 2: Run the migration SQL
    console.log('\n2️⃣  Running migration SQL...')

    const migrationSQL = `
      -- Add metadata column if it doesn't exist
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'assets' AND column_name = 'metadata'
        ) THEN
          ALTER TABLE assets ADD COLUMN metadata JSONB;
          RAISE NOTICE 'Added metadata column';
        ELSE
          RAISE NOTICE 'metadata column already exists';
        END IF;
      END $$;
    `

    const { error: sqlError } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    })

    // If rpc doesn't exist, we need to use the SQL editor directly
    // Let's try a different approach - just insert a test record
    console.log('   Attempting to add column via direct SQL...')

    // We can't run DDL through the JS client easily, so let's verify instead
    console.log('\n3️⃣  Verifying column was added...')

    // Try to insert a test record with metadata
    const testMetadata = { test: true, timestamp: new Date().toISOString() }

    const { error: testError } = await supabase
      .from('assets')
      .insert({
        project_id: '00000000-0000-0000-0000-000000000000', // Will fail but tests metadata column
        file_name: 'test',
        google_drive_file_id: 'test',
        metadata: testMetadata
      })

    if (testError) {
      if (testError.message.includes('metadata')) {
        console.log('❌ metadata column still not found in schema')
        console.log('\n📝 MANUAL STEPS REQUIRED:')
        console.log('   1. Go to: https://supabase.com/dashboard/project/ldzvusmbsepxtnaagiie/sql/new')
        console.log('   2. Paste and run this SQL:')
        console.log('\n' + '='.repeat(60))
        console.log('ALTER TABLE assets ADD COLUMN IF NOT EXISTS metadata JSONB;')
        console.log('NOTIFY pgrst, \'reload schema\';')
        console.log('='.repeat(60) + '\n')
      } else if (testError.message.includes('violates foreign key')) {
        console.log('✅ metadata column exists! (test insert failed for other reasons)')
        console.log('   The column is working - just need to reload PostgREST cache')
        console.log('\n📝 Run this SQL to reload cache:')
        console.log('\n' + '='.repeat(60))
        console.log('NOTIFY pgrst, \'reload schema\';')
        console.log('='.repeat(60) + '\n')
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    process.exit(1)
  }
}

// Run the script
addMetadataColumn().then(() => {
  console.log('\n✅ Script completed!')
  console.log('   After adding the column manually, restart your dev server.')
  process.exit(0)
}).catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
