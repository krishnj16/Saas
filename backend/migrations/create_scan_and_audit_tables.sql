BEGIN;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE TABLE IF NOT EXISTS scan_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id uuid,
  status text NOT NULL DEFAULT 'queued',
  queued_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  worker_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scan_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_task_id uuid,
  scanner_name text,
  raw_json jsonb,
  s3_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vulnerabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_task_id uuid,
  website_id uuid,
  scanner text,
  type text,
  severity text,
  title text,
  path text,
  parameter text,
  evidence text,
  raw jsonb,
  discovered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS malware_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_task_id uuid,
  file_path text,
  sha256 text,
  virustotal_status jsonb,
  checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ip_reputation_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_task_id uuid,
  ip inet,
  score numeric,
  details jsonb,
  checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  scan_task_id uuid,
  message text,
  severity text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  data jsonb,
  timestamp timestamptz NOT NULL DEFAULT now()
);

-- -------------------------
-- Safe index creation
-- -------------------------
-- Use conditional blocks so index creation only runs when columns exist

DO $$
BEGIN
  -- GIN indexes for JSONB fields
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vulnerabilities' AND column_name='raw') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='vulnerabilities' AND indexname='idx_vuln_raw_gin') THEN
      EXECUTE 'CREATE INDEX idx_vuln_raw_gin ON vulnerabilities USING gin (raw jsonb_path_ops)';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scan_outputs' AND column_name='raw_json') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='scan_outputs' AND indexname='idx_scan_outputs_raw_gin') THEN
      EXECUTE 'CREATE INDEX idx_scan_outputs_raw_gin ON scan_outputs USING gin (raw_json jsonb_path_ops)';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='malware_results' AND column_name='virustotal_status') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='malware_results' AND indexname='idx_malware_virustotal_gin') THEN
      EXECUTE 'CREATE INDEX idx_malware_virustotal_gin ON malware_results USING gin (virustotal_status jsonb_path_ops)';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ip_reputation_results' AND column_name='details') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='ip_reputation_results' AND indexname='idx_iprep_details_gin') THEN
      EXECUTE 'CREATE INDEX idx_iprep_details_gin ON ip_reputation_results USING gin (details jsonb_path_ops)';
    END IF;
  END IF;

  -- Btree indexes for queries
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vulnerabilities' AND column_name='website_id') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='vulnerabilities' AND indexname='idx_vuln_website') THEN
      EXECUTE 'CREATE INDEX idx_vuln_website ON vulnerabilities (website_id)';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vulnerabilities' AND column_name='scan_task_id') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='vulnerabilities' AND indexname='idx_vuln_scan_task') THEN
      EXECUTE 'CREATE INDEX idx_vuln_scan_task ON vulnerabilities (scan_task_id)';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vulnerabilities' AND column_name='discovered_at') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='vulnerabilities' AND indexname='idx_vuln_discovered_at') THEN
      EXECUTE 'CREATE INDEX idx_vuln_discovered_at ON vulnerabilities (discovered_at)';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scan_tasks' AND column_name='website_id') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='scan_tasks' AND indexname='idx_scan_tasks_website') THEN
      EXECUTE 'CREATE INDEX idx_scan_tasks_website ON scan_tasks (website_id)';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scan_tasks' AND column_name='status') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='scan_tasks' AND indexname='idx_scan_tasks_status') THEN
      EXECUTE 'CREATE INDEX idx_scan_tasks_status ON scan_tasks (status)';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scan_outputs' AND column_name='scan_task_id') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='scan_outputs' AND indexname='idx_scan_outputs_scan_task') THEN
      EXECUTE 'CREATE INDEX idx_scan_outputs_scan_task ON scan_outputs (scan_task_id)';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='malware_results' AND column_name='scan_task_id') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='malware_results' AND indexname='idx_malware_scan_task') THEN
      EXECUTE 'CREATE INDEX idx_malware_scan_task ON malware_results (scan_task_id)';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='malware_results' AND column_name='sha256') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='malware_results' AND indexname='idx_malware_sha256') THEN
      EXECUTE 'CREATE INDEX idx_malware_sha256 ON malware_results (sha256)';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ip_reputation_results' AND column_name='scan_task_id') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='ip_reputation_results' AND indexname='idx_iprep_scan_task') THEN
      EXECUTE 'CREATE INDEX idx_iprep_scan_task ON ip_reputation_results (scan_task_id)';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='user_id') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='notifications' AND indexname='idx_notifications_user') THEN
      EXECUTE 'CREATE INDEX idx_notifications_user ON notifications (user_id)';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='scan_task_id') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='notifications' AND indexname='idx_notifications_scan_task') THEN
      EXECUTE 'CREATE INDEX idx_notifications_scan_task ON notifications (scan_task_id)';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='timestamp') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='audit_logs' AND indexname='idx_audit_timestamp') THEN
      EXECUTE 'CREATE INDEX idx_audit_timestamp ON audit_logs (timestamp)';
    END IF;
  END IF;

END;
$$;

COMMIT;
