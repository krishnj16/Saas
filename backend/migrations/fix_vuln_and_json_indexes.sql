BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = current_schema() AND tablename = 'vulnerabilities'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = current_schema() AND table_name = 'vulnerabilities' AND column_name = 'raw'
    ) THEN
      ALTER TABLE vulnerabilities ADD COLUMN IF NOT EXISTS raw jsonb;
    END IF;
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = current_schema() AND tablename = 'scan_outputs'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = current_schema() AND table_name = 'scan_outputs' AND column_name = 'raw_json'
    ) THEN
      ALTER TABLE scan_outputs ADD COLUMN IF NOT EXISTS raw_json jsonb;
    END IF;
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = current_schema() AND tablename = 'malware_results'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = current_schema() AND table_name = 'malware_results' AND column_name = 'virustotal_status'
    ) THEN
      ALTER TABLE malware_results ADD COLUMN IF NOT EXISTS virustotal_status jsonb;
    END IF;
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = current_schema() AND tablename = 'ip_reputation_results'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = current_schema() AND table_name = 'ip_reputation_results' AND column_name = 'details'
    ) THEN
      ALTER TABLE ip_reputation_results ADD COLUMN IF NOT EXISTS details jsonb;
    END IF;
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'vulnerabilities' AND column_name = 'raw'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND tablename = 'vulnerabilities' AND indexname = 'idx_vuln_raw_gin'
    ) THEN
      EXECUTE 'CREATE INDEX idx_vuln_raw_gin ON vulnerabilities USING gin (raw jsonb_path_ops)';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'scan_outputs' AND column_name = 'raw_json'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND tablename = 'scan_outputs' AND indexname = 'idx_scan_outputs_raw_gin'
    ) THEN
      EXECUTE 'CREATE INDEX idx_scan_outputs_raw_gin ON scan_outputs USING gin (raw_json jsonb_path_ops)';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'malware_results' AND column_name = 'virustotal_status'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND tablename = 'malware_results' AND indexname = 'idx_malware_virustotal_gin'
    ) THEN
      EXECUTE 'CREATE INDEX idx_malware_virustotal_gin ON malware_results USING gin (virustotal_status jsonb_path_ops)';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'ip_reputation_results' AND column_name = 'details'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND tablename = 'ip_reputation_results' AND indexname = 'idx_iprep_details_gin'
    ) THEN
      EXECUTE 'CREATE INDEX idx_iprep_details_gin ON ip_reputation_results USING gin (details jsonb_path_ops)';
    END IF;
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = current_schema() AND tablename = 'vulnerabilities'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND tablename = 'vulnerabilities' AND indexname = 'idx_vuln_website'
    ) THEN
      EXECUTE 'CREATE INDEX idx_vuln_website ON vulnerabilities (website_id)';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND tablename = 'vulnerabilities' AND indexname = 'idx_vuln_scan_task'
    ) THEN
      EXECUTE 'CREATE INDEX idx_vuln_scan_task ON vulnerabilities (scan_task_id)';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND tablename = 'vulnerabilities' AND indexname = 'idx_vuln_discovered_at'
    ) THEN
      EXECUTE 'CREATE INDEX idx_vuln_discovered_at ON vulnerabilities (discovered_at)';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = current_schema() AND tablename = 'scan_tasks'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND tablename = 'scan_tasks' AND indexname = 'idx_scan_tasks_website'
    ) THEN
      EXECUTE 'CREATE INDEX idx_scan_tasks_website ON scan_tasks (website_id)';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND tablename = 'scan_tasks' AND indexname = 'idx_scan_tasks_status'
    ) THEN
      EXECUTE 'CREATE INDEX idx_scan_tasks_status ON scan_tasks (status)';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = current_schema() AND tablename = 'scan_outputs'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND tablename = 'scan_outputs' AND indexname = 'idx_scan_outputs_scan_task'
    ) THEN
      EXECUTE 'CREATE INDEX idx_scan_outputs_scan_task ON scan_outputs (scan_task_id)';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = current_schema() AND tablename = 'malware_results'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND tablename = 'malware_results' AND indexname = 'idx_malware_scan_task'
    ) THEN
      EXECUTE 'CREATE INDEX idx_malware_scan_task ON malware_results (scan_task_id)';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND tablename = 'malware_results' AND indexname = 'idx_malware_sha256'
    ) THEN
      EXECUTE 'CREATE INDEX idx_malware_sha256 ON malware_results (sha256)';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = current_schema() AND tablename = 'ip_reputation_results'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND tablename = 'ip_reputation_results' AND indexname = 'idx_iprep_scan_task'
    ) THEN
      EXECUTE 'CREATE INDEX idx_iprep_scan_task ON ip_reputation_results (scan_task_id)';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = current_schema() AND tablename = 'notifications'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND tablename = 'notifications' AND indexname = 'idx_notifications_user'
    ) THEN
      EXECUTE 'CREATE INDEX idx_notifications_user ON notifications (user_id)';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND tablename = 'notifications' AND indexname = 'idx_notifications_scan_task'
    ) THEN
      EXECUTE 'CREATE INDEX idx_notifications_scan_task ON notifications (scan_task_id)';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = current_schema() AND tablename = 'audit_logs'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND tablename = 'audit_logs' AND indexname = 'idx_audit_timestamp'
    ) THEN
      EXECUTE 'CREATE INDEX idx_audit_timestamp ON audit_logs (timestamp)';
    END IF;
  END IF;
END;
$$;

COMMIT;
