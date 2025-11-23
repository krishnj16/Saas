require('dotenv').config({ path: './.env' });
const { Client } = require('pg');

(async () => {
  const client = new Client({
    host: process.env.PGHOST || process.env.DB_HOST || 'localhost',
    user: process.env.PGUSER || process.env.DB_USER || 'postgres',
    password: process.env.PGPASSWORD || process.env.DB_PASS || '',
    database: process.env.PGDATABASE || process.env.DB_NAME || 'saasdb',
    port: process.env.PGPORT || process.env.DB_PORT || 5432,
  });

  try {
    await client.connect();
    const retention = parseInt(process.env.RETENTION_DAYS || '90', 10);
    const res = await client.query(
      `DELETE FROM scan_outputs WHERE created_at < NOW() - INTERVAL '${retention} days'`
    );
    logger.info(` Deleted rows: ${res.rowCount}`);
  } catch (e) {
    logger.error(' Purge failed:', e.message);
  } finally {
    await client.end();
  }
})();
