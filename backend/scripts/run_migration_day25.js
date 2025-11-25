const fs = require('fs');
const path = require('path');
const pool = require('../utils/db'); 

async function run() {
  const sqlPath = path.join(__dirname, '..', 'sql', 'migrations', '20251023_day25_ip_reputation.sql');
  if (!fs.existsSync(sqlPath)) {
    logger.error('Migration file not found:', sqlPath);
    process.exit(1);
  }
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const client = await pool.connect();
  try {
    logger.info('Running migration SQL...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    logger.info('Migration applied successfully.');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    logger.error('Migration failed:', err);
    process.exit(1);
  } finally {
    try { client.release(); } catch (e) {}
    try { await pool.end(); } catch (e) {}
  }
}

run();
