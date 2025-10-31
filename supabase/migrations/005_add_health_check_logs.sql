-- Create health_check_logs table to track automated health checks
CREATE TABLE IF NOT EXISTS health_check_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_type TEXT NOT NULL, -- 'sendgrid', 'supabase', etc.
  email_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_health_check_logs_check_type
  ON health_check_logs(check_type);

CREATE INDEX IF NOT EXISTS idx_health_check_logs_email_sent_at
  ON health_check_logs(email_sent_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE health_check_logs ENABLE ROW LEVEL SECURITY;

-- Create policy: Only service role can insert (used by cron job)
CREATE POLICY "Service role can insert health check logs"
  ON health_check_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create policy: Allow service role to read logs
CREATE POLICY "Service role can read health check logs"
  ON health_check_logs
  FOR SELECT
  TO service_role
  USING (true);

-- Comment on table
COMMENT ON TABLE health_check_logs IS 'Tracks automated health check executions to prevent duplicate emails';
COMMENT ON COLUMN health_check_logs.check_type IS 'Type of health check: sendgrid, supabase, etc.';
COMMENT ON COLUMN health_check_logs.email_sent_at IS 'When the health check email was sent';
