// showWebsiteScans.js
require('dotenv').config();
const pool = require('./backend/utils/db');

(async () => {
  try {
    const { rows } = await pool.query('SELECT id, website_id, status, created_at, meta FROM website_scans ORDER BY created_at DESC LIMIT 20');
    console.log('website_scans (latest 20):');
    rows.forEach(r => console.log(r));
  } catch (e) {
    console.error('DB error:', e.message || e);
  } finally {
    try { await pool.end(); } catch (e) {}
    process.exit(0);
  }
})();
