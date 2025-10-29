-- Run this in Supabase SQL Editor to check if assets have client_email

-- Check all assets in your project
SELECT
  id,
  file_name,
  status,
  client_email,
  created_at
FROM assets
WHERE project_id = 'YOUR_PROJECT_ID_HERE'
ORDER BY created_at DESC;

-- If client_email is NULL, emails won't be sent!
