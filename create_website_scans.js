const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const pool = require('./utils/db');

(async () => {
  try {
    try {
      await pool.query("CREATE EXTENSION IF NOT EXISTS pgcrypto;");
      console.log('pgcrypto extension ensured');
    } catch (e) {
      console.warn('Could not ensure pgcrypto (may require superuser). Continuing.');
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
    console.log(' website_scans table created (or already exists).');
  } catch (e) {
    console.error('Migration failed:', e && e.message ? e.message : e);
  } finally {
    try { await pool.end(); } catch (e) {}
    process.exit(0);
  }
})();
