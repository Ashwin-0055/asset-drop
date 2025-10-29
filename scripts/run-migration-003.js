/**
 * Script to run migration 003: Add rejection_reason column to assets table
 *
 * This adds the ability to store rejection reasons when assets are rejected.
 *
 * Usage:
 *   node scripts/run-migration-003.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

async function runMigration() {
  console.log('🚀 Running migration 003: Add rejection_reason column\n')

  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/003_add_rejection_reason.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('📄 Migration file loaded')
    console.log('📊 Executing SQL...\n')

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL })

    if (error) {
      // If exec_sql doesn't exist, try direct query
      console.log('⚠️  exec_sql not found, trying direct query...\n')

      const { error: directError } = await supabase
        .from('assets')
        .select('rejection_reason')
        .limit(1)

      if (directError && directError.message.includes('column "rejection_reason" does not exist')) {
        console.error('❌ Migration needs to be run in Supabase SQL Editor')
        console.log('\n📝 Instructions:')
        console.log('1. Go to your Supabase project dashboard')
        console.log('2. Navigate to SQL Editor')
        console.log('3. Copy and paste the contents of:')
        console.log('   supabase/migrations/003_add_rejection_reason.sql')
        console.log('4. Click "Run" to execute the migration')
        process.exit(1)
      } else if (!directError) {
        console.log('✅ Column already exists! Migration already applied.')
        process.exit(0)
      } else {
        throw directError
      }
    }

    console.log('✅ Migration completed successfully!')
    console.log('\n📊 Changes:')
    console.log('   - Added rejection_reason column to assets table')
    console.log('   - Type: TEXT (nullable)')
    console.log('   - Purpose: Store reason for rejecting an asset')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.log('\n💡 Tip: Run this migration manually in Supabase SQL Editor')
    console.log('   File: supabase/migrations/003_add_rejection_reason.sql')
    process.exit(1)
  }
}

runMigration()
