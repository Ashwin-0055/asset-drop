-- Add metadata column to assets table
-- This allows storing text responses and additional file information

-- Add the metadata column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assets'
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE assets ADD COLUMN metadata JSONB;
    RAISE NOTICE 'Added metadata column to assets table';
  ELSE
    RAISE NOTICE 'metadata column already exists';
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN assets.metadata IS 'Flexible JSONB storage for text responses (field_type, content), file metadata, and other additional information';

-- Completion message
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: metadata column added to assets table';
END $$;
