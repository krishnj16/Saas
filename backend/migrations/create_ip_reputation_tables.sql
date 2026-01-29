CREATE TABLE IF NOT EXISTS ip_reputation_results (
  id SERIAL PRIMARY KEY,
  ip INET NOT NULL,
  provider TEXT NOT NULL,
  provider_id TEXT,              
  score NUMERIC,                
  raw JSONB,                    
  ttl_at TIMESTAMP WITH TIME ZONE, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_iprep_ip_provider ON ip_reputation_results (ip, provider);

CREATE TABLE IF NOT EXISTS ip_reputation_queue (
  id SERIAL PRIMARY KEY,
  scan_id UUID,                 
  host_id UUID,                  
  ip INET NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', 
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  enqueued_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_iprep_queue_status ON ip_reputation_queue (status);

ALTER TABLE IF EXISTS scan_summary
  ADD COLUMN IF NOT EXISTS ip_reputation_summary JSONB DEFAULT '{}' ;
