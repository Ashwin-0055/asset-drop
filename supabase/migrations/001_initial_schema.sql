-- AssetDrop Database Schema
-- Run this migration in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User tokens for Google Drive OAuth
CREATE TABLE IF NOT EXISTS user_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  client_name TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending', -- pending, in_review, complete
  shareable_link_id TEXT UNIQUE NOT NULL,
  link_password TEXT,
  link_expiry TIMESTAMPTZ,
  link_disabled BOOLEAN DEFAULT FALSE,
  google_drive_folder_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Form fields (builder configuration)
CREATE TABLE IF NOT EXISTS form_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  field_type TEXT NOT NULL, -- file_upload, text_input, url_field, image_gallery, audio_video, code_snippet, section_header
  label TEXT NOT NULL,
  help_text TEXT,
  internal_note TEXT,
  is_required BOOLEAN DEFAULT FALSE,
  field_order INTEGER NOT NULL,
  storage_subfolder TEXT, -- For organizing files in Drive
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assets table (uploaded files)
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  form_field_id UUID REFERENCES form_fields(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  google_drive_file_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  uploaded_by TEXT DEFAULT 'client',
  metadata JSONB, -- Flexible storage for text responses, file info, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- project_created, file_uploaded, asset_approved, etc.
  action_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_link_id ON projects(shareable_link_id);
CREATE INDEX IF NOT EXISTS idx_form_fields_project ON form_fields(project_id);
CREATE INDEX IF NOT EXISTS idx_form_fields_order ON form_fields(project_id, field_order);
CREATE INDEX IF NOT EXISTS idx_assets_project ON assets(project_id);
CREATE INDEX IF NOT EXISTS idx_assets_field ON assets(form_field_id);
CREATE INDEX IF NOT EXISTS idx_activity_project ON activity_log(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User tokens policies
DROP POLICY IF EXISTS "Users can view own tokens" ON user_tokens;
CREATE POLICY "Users can view own tokens"
  ON user_tokens FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tokens" ON user_tokens;
CREATE POLICY "Users can insert own tokens"
  ON user_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tokens" ON user_tokens;
CREATE POLICY "Users can update own tokens"
  ON user_tokens FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tokens" ON user_tokens;
CREATE POLICY "Users can delete own tokens"
  ON user_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Projects policies
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can view project by link" ON projects;
CREATE POLICY "Public can view project by link"
  ON projects FOR SELECT
  USING (TRUE); -- Anyone can view by shareable_link_id

DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Form fields policies
DROP POLICY IF EXISTS "Users can view form fields of own projects" ON form_fields;
CREATE POLICY "Users can view form fields of own projects"
  ON form_fields FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = form_fields.project_id
      AND (projects.user_id = auth.uid() OR TRUE) -- Public for client portal
    )
  );

DROP POLICY IF EXISTS "Users can insert form fields to own projects" ON form_fields;
CREATE POLICY "Users can insert form fields to own projects"
  ON form_fields FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = form_fields.project_id
      AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update form fields of own projects" ON form_fields;
CREATE POLICY "Users can update form fields of own projects"
  ON form_fields FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = form_fields.project_id
      AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete form fields of own projects" ON form_fields;
CREATE POLICY "Users can delete form fields of own projects"
  ON form_fields FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = form_fields.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Assets policies
DROP POLICY IF EXISTS "Users can view assets of own projects" ON assets;
CREATE POLICY "Users can view assets of own projects"
  ON assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = assets.project_id
      AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Anyone can insert assets via client portal" ON assets;
CREATE POLICY "Anyone can insert assets via client portal"
  ON assets FOR INSERT
  WITH CHECK (TRUE); -- Controlled by application logic

DROP POLICY IF EXISTS "Users can update assets of own projects" ON assets;
CREATE POLICY "Users can update assets of own projects"
  ON assets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = assets.project_id
      AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete assets of own projects" ON assets;
CREATE POLICY "Users can delete assets of own projects"
  ON assets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = assets.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Activity log policies
DROP POLICY IF EXISTS "Users can view activity of own projects" ON activity_log;
CREATE POLICY "Users can view activity of own projects"
  ON activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = activity_log.project_id
      AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Anyone can insert activity logs" ON activity_log;
CREATE POLICY "Anyone can insert activity logs"
  ON activity_log FOR INSERT
  WITH CHECK (TRUE); -- Controlled by application logic

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS set_updated_at_profiles ON profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_projects ON projects;
CREATE TRIGGER set_updated_at_projects
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_assets ON assets;
CREATE TRIGGER set_updated_at_assets
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth.users';
COMMENT ON TABLE user_tokens IS 'Google Drive OAuth tokens for each user';
COMMENT ON TABLE projects IS 'Asset collection projects';
COMMENT ON TABLE form_fields IS 'Form builder configuration for each project';
COMMENT ON TABLE assets IS 'Uploaded files metadata linked to Google Drive';
COMMENT ON TABLE activity_log IS 'Audit trail of all project activities';

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

DO $$
BEGIN
  RAISE NOTICE 'AssetDrop database schema created successfully!';
  RAISE NOTICE 'Tables: profiles, user_tokens, projects, form_fields, assets, activity_log';
  RAISE NOTICE 'All RLS policies enabled';
  RAISE NOTICE 'Triggers configured for auto-profile creation and timestamp updates';
END $$;
