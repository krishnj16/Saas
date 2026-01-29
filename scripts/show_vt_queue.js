const { Client } = require('pg');
(async () => {
  const conn = process.env.DATABASE_URL || 'postgresql://postgres:Maina@123@localhost:5432/saasdb';
  const c = new Client({ connectionString: conn });
  try {
    await c.connect();
    const res = await c.query("SELECT id, sha256, attempts, created_at FROM virustotal_queue ORDER BY created_at DESC LIMIT 20");
    logger.info('virustotal_queue rows:', res.rows);
  } catch (e) {
    logger.error('ERROR show_vt_queue:', e.message || e);
    process.exitCode = 1;
  } finally {
    await c.end();
  }
})();
