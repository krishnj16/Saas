CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE IF NOT EXISTS scan_discovery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_task_id UUID,                      
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  url TEXT NOT NULL,                      
  action_url TEXT,                        
  method VARCHAR(10),                     
  param_name TEXT,                        
  input_type TEXT,                        
  sample_value TEXT,                      
  is_hidden BOOLEAN DEFAULT FALSE,
  is_csrf BOOLEAN DEFAULT FALSE,          
  extra JSONB DEFAULT '{}'                
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_scan_discovery_task_url_action_param
  ON scan_discovery (scan_task_id, url, action_url, param_name);
CREATE INDEX IF NOT EXISTS idx_scan_discovery_scan_task_url ON scan_discovery (scan_task_id, url);
CREATE INDEX IF NOT EXISTS idx_scan_discovery_param ON scan_discovery (param_name);
CREATE INDEX IF NOT EXISTS idx_scan_discovery_action_url ON scan_discovery (action_url);