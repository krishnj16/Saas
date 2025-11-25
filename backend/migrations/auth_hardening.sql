CREATE TABLE IF NOT EXISTS user_refresh_tokens (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  last_used_at timestamptz NULL,
  device_info text NULL,
  revoked boolean NOT NULL DEFAULT false
);
