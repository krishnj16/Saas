CREATE TABLE IF NOT EXISTS vulnerabilities (
  id SERIAL PRIMARY KEY,
  scan_task_id INTEGER NOT NULL,
  scanner TEXT NOT NULL,
  type TEXT,
  severity TEXT,
  title TEXT,
  description TEXT,
  path TEXT,
  parameter TEXT,
  evidence TEXT,
  raw_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vulns_scan_task ON vulnerabilities(scan_task_id);
