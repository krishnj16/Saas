CREATE TABLE IF NOT EXISTS scan_outputs (
  id SERIAL PRIMARY KEY,
  scan_task_id INTEGER NOT NULL,
  scanner_name TEXT NOT NULL,
  raw_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scanoutputs_task ON scan_outputs(scan_task_id);
