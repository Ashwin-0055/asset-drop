-- Add approval_remark and client_email columns to assets table
-- This enables:
-- 1. Adding remarks/notes to approved assets (not just rejected ones)
-- 2. Storing client email for sending review notifications

-- Add the approval_remark column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assets'
    AND column_name = 'approval_remark'
  ) THEN
    ALTER TABLE assets ADD COLUMN approval_remark TEXT;
    RAISE NOTICE 'Added approval_remark column to assets table';
  ELSE
    RAISE NOTICE 'approval_remark column already exists';
  END IF;
END $$;

-- Add the client_email column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assets'
    AND column_name = 'client_email'
  ) THEN
    ALTER TABLE assets ADD COLUMN client_email TEXT;
    RAISE NOTICE 'Added client_email column to assets table';
  ELSE
    RAISE NOTICE 'client_email column already exists';
  END IF;
END $$;

-- Add comments
COMMENT ON COLUMN assets.approval_remark IS 'Optional note/remark added when approving an asset. Visible to client in email notifications.';
COMMENT ON COLUMN assets.client_email IS 'Email address of the client who submitted this asset. Used for sending review notifications.';

-- Create index for email lookups (for grouping assets by client)
CREATE INDEX IF NOT EXISTS idx_assets_client_email ON assets(client_email);

-- Completion message
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: approval_remark and client_email columns added to assets table';
  RAISE NOTICE 'Index created on client_email for faster lookups';
END $$;
