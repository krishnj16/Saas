const { pool } = require('../configs/db');

async function run() {
  const sql = `
    ALTER TABLE websites
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

    CREATE INDEX IF NOT EXISTS idx_websites_active_not_deleted
      ON websites (owner_id)
      WHERE deleted_at IS NULL;

    ALTER TABLE websites DROP CONSTRAINT IF EXISTS websites_owner_url_unique;

    CREATE UNIQUE INDEX IF NOT EXISTS ux_websites_owner_url_not_deleted
      ON websites (owner_id, url)
      WHERE deleted_at IS NULL;
  `;

  try {
    await pool.query(sql);
    logger.info(' deleted_at column added successfully');
  } catch (err) {
    logger.error(' Migration failed:', err);
  } finally {
    pool.end();
  }
}

run();
