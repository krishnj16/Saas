
CREATE TABLE IF NOT EXISTS scan_ips (
  id SERIAL PRIMARY KEY,
  scan_id UUID,
  host TEXT,
  ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ip_reputation_queue (
  id SERIAL PRIMARY KEY,
  scan_id UUID,
  host_id INTEGER,
  ip TEXT NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  enqueued_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS ip_reputation_results (
  id SERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  provider TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  raw JSONB,
  ttl_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ip_reputation_results_ip_provider ON ip_reputation_results (ip, provider);
CREATE INDEX IF NOT EXISTS idx_ip_reputation_queue_status ON ip_reputation_queue (status);
