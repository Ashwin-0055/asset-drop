-- Add rejection_reason column to assets table
-- This allows storing a message explaining why an asset was rejected

-- Add the rejection_reason column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assets'
    AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE assets ADD COLUMN rejection_reason TEXT;
    RAISE NOTICE 'Added rejection_reason column to assets table';
  ELSE
    RAISE NOTICE 'rejection_reason column already exists';
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN assets.rejection_reason IS 'Optional message explaining why this asset was rejected. Only relevant when status is rejected.';

-- Completion message
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: rejection_reason column added to assets table';
END $$;
