BEGIN;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = current_schema() AND table_name = 'vulnerabilities'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = current_schema() AND table_name = 'vulnerabilities' AND column_name = 'discovered_at'
    ) THEN
      ALTER TABLE vulnerabilities ADD COLUMN discovered_at timestamptz;
    END IF;
  END IF;
END;
$$;

COMMIT;
