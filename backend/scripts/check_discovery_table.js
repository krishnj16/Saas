const pool = require('../utils/db');

(async () => {
  try {
    const res = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_name = 'scan_discovery'"
    );
    logger.info(res.rows.length ? '✅ Table scan_discovery exists!' : '❌ Table not found.');
  } catch (err) {
    logger.error('Error:', err.message);
  } finally {
    pool.end();
  }
})();
