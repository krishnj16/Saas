const pool = require('../utils/db');

async function run() {
  try {
    const res = await pool.query(`
      SELECT tablename, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = current_schema()
      AND tablename IN (
        'vulnerabilities',
        'scan_outputs',
        'malware_results',
        'ip_reputation_results',
        'scan_tasks',
        'audit_logs'
      )
      ORDER BY tablename, indexname;
    `);
    console.table(res.rows);
  } catch (err) {
    logger.error(err.message || err);
  } finally {
    await pool.end();
  }
}

run();
