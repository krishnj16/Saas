// backend/scripts/check_mapped_now.js
const pool = require('../utils/db');

(async function() {
  try {
    const r = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM websites) AS total_websites,
        (SELECT COUNT(*) FROM websites w WHERE EXISTS (SELECT 1 FROM users u WHERE u.id = w.owner_id)) AS mapped_now
    `);
    console.table(r.rows);
  } catch (err) {
    console.error(err.message || err);
  } finally {
    await pool.end();
  }
})();
