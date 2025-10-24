// showScanTasks.js
require('dotenv').config();
const pool = require('./backend/utils/db');

(async () => {
  try {
    const { rows } = await pool.query('SELECT id, queue_job_id, status, started_at, finished_at, result_location, meta FROM scan_tasks ORDER BY created_at DESC LIMIT 20');
    console.log('scan_tasks (latest 20):');
    rows.forEach(r => console.log(r));
  } catch (e) {
    console.error('DB error:', e.message || e);
  } finally {
    try { await pool.end(); } catch (e) {}
    process.exit(0);
  }
})();
