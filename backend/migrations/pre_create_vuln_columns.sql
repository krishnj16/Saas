BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = current_schema() AND tablename = 'vulnerabilities') THEN
    ALTER TABLE vulnerabilities ADD COLUMN IF NOT EXISTS website_id uuid;
    ALTER TABLE vulnerabilities ADD COLUMN IF NOT EXISTS scan_task_id uuid;
    ALTER TABLE vulnerabilities ADD COLUMN IF NOT EXISTS scanner text;
    ALTER TABLE vulnerabilities ADD COLUMN IF NOT EXISTS type text;
    ALTER TABLE vulnerabilities ADD COLUMN IF NOT EXISTS severity text;
    ALTER TABLE vulnerabilities ADD COLUMN IF NOT EXISTS title text;
    ALTER TABLE vulnerabilities ADD COLUMN IF NOT EXISTS path text;
    ALTER TABLE vulnerabilities ADD COLUMN IF NOT EXISTS parameter text;
    ALTER TABLE vulnerabilities ADD COLUMN IF NOT EXISTS evidence text;
    ALTER TABLE vulnerabilities ADD COLUMN IF NOT EXISTS raw jsonb;
    ALTER TABLE vulnerabilities ADD COLUMN IF NOT EXISTS discovered_at timestamptz;
    ALTER TABLE vulnerabilities ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
  END IF;
END;
$$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = current_schema() AND tablename = 'scan_outputs') THEN
    ALTER TABLE scan_outputs ADD COLUMN IF NOT EXISTS scan_task_id uuid;
    ALTER TABLE scan_outputs ADD COLUMN IF NOT EXISTS scanner_name text;
    ALTER TABLE scan_outputs ADD COLUMN IF NOT EXISTS raw_json jsonb;
    ALTER TABLE scan_outputs ADD COLUMN IF NOT EXISTS s3_url text;
    ALTER TABLE scan_outputs ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = current_schema() AND tablename = 'malware_results') THEN
    ALTER TABLE malware_results ADD COLUMN IF NOT EXISTS scan_task_id uuid;
    ALTER TABLE malware_results ADD COLUMN IF NOT EXISTS file_path text;
    ALTER TABLE malware_results ADD COLUMN IF NOT EXISTS sha256 text;
    ALTER TABLE malware_results ADD COLUMN IF NOT EXISTS virustotal_status jsonb;
    ALTER TABLE malware_results ADD COLUMN IF NOT EXISTS checked_at timestamptz;
    ALTER TABLE malware_results ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = current_schema() AND tablename = 'ip_reputation_results') THEN
    ALTER TABLE ip_reputation_results ADD COLUMN IF NOT EXISTS scan_task_id uuid;
    ALTER TABLE ip_reputation_results ADD COLUMN IF NOT EXISTS ip inet;
    ALTER TABLE ip_reputation_results ADD COLUMN IF NOT EXISTS score numeric;
    ALTER TABLE ip_reputation_results ADD COLUMN IF NOT EXISTS details jsonb;
    ALTER TABLE ip_reputation_results ADD COLUMN IF NOT EXISTS checked_at timestamptz;
    ALTER TABLE ip_reputation_results ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = current_schema() AND tablename = 'notifications') THEN
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id uuid;
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS scan_task_id uuid;
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message text;
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS severity text;
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at timestamptz;
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = current_schema() AND tablename = 'audit_logs') THEN
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_id uuid;
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS action text;
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS resource_type text;
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS resource_id uuid;
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS data jsonb;
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS timestamp timestamptz DEFAULT now();
  END IF;
END;
$$;

COMMIT;
