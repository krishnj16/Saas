
const pool = require('../utils/db');

(async () => {
  try {
    const res = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
    );
    console.log('tables:', res.rows.map(r => r.table_name));
  } catch (err) {
    console.error('error listing tables:', err);
  } finally {
    try { await pool.end(); } catch (_) {}
  }
})();
