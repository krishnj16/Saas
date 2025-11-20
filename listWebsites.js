
require('dotenv').config();
const pool = require('./utils/db');

(async () => {
  try {
    const { rows } = await pool.query(`
      SELECT id, url, created_at
      FROM websites
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 50
    `);
    if (!rows || rows.length === 0) {
      console.log('No websites found in the database.');
      process.exit(0);
    }
    console.log('Recent websites (id — url):');
    rows.forEach(r => {
      console.log(`${r.id}  —  ${r.url}`);
    });
  } catch (e) {
    console.error('DB error:', e && e.message ? e.message : e);
  } finally {
    try { await pool.end(); } catch (e) {}
    process.exit(0);
  }
})();
