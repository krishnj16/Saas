
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NULL,                
  site_id BIGINT NULL,             
  type TEXT NOT NULL,               
  severity TEXT NOT NULL,           
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  email_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS user_id TEXT,
  ADD COLUMN IF NOT EXISTS site_id BIGINT,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS severity TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS body TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

CREATE INDEX IF NOT EXISTS notifications_user_id_is_read_idx ON notifications (user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_site_id_created_at_idx ON notifications (site_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications (created_at DESC);

CREATE TABLE IF NOT EXISTS user_notification_settings (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_site_notification_settings (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  site_id BIGINT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(user_id, site_id)
);

CREATE TABLE IF NOT EXISTS admin_mutes (
  id BIGSERIAL PRIMARY KEY,
  site_id BIGINT NULL,
  severity TEXT NULL,
  reason TEXT NULL,
  muted_by TEXT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_mutes_site_severity_idx ON admin_mutes (site_id, severity);

ANALYZE notifications;
