/**
 * migrations/create_website_scans.js
 * Run: node migrations/create_website_scans.js
 *
 * This creates website_scans using pgcrypto's gen_random_uuid().
 * If your DB doesn't allow extensions, it will still attempt the table creation.
 */
require('dotenv').config();
const pool = require('./backend/utils/db');

(async () => {
  try {
    // ensure extension exists for gen_random_uuid (safe if already present)
    try {
      await pool.query("CREATE EXTENSION IF NOT EXISTS pgcrypto;");
      console.log('pgcrypto extension ensured');
    } catch (e) {
      console.warn('Could not create pgcrypto extension (may require superuser). Continuing — UUID default may not be available.', e.message || e);
    }

    const sql = `
      CREATE TABLE IF NOT EXISTS website_scans (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        website_id uuid NOT NULL,
        status varchar(32) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        meta jsonb DEFAULT '{}'::jsonb
      );
    `;
    await pool.query(sql);
    console.log('✅ website_scans table created (or already exists).');
  } catch (e) {
    console.error('❌ Migration failed:', e && e.message ? e.message : e);
  } finally {
    try { await pool.end(); } catch (e) {}
    process.exit(0);
  }
})();
