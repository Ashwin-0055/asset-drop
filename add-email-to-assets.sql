-- Run this in Supabase SQL Editor to add email to existing assets
-- Replace with your actual values

-- Update a specific asset
UPDATE assets
SET client_email = 'your-email@gmail.com'
WHERE id = 'YOUR_ASSET_ID_HERE';

-- OR update all assets in a project
UPDATE assets
SET client_email = 'your-email@gmail.com'
WHERE project_id = 'YOUR_PROJECT_ID_HERE';

-- Verify the update
SELECT id, file_name, client_email
FROM assets
WHERE project_id = 'YOUR_PROJECT_ID_HERE';
