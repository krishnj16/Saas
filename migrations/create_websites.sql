CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  owner_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_scan_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT websites_owner_url_unique UNIQUE (owner_id, url),
  CONSTRAINT websites_owner_fk FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_websites_owner_id ON websites(owner_id);
