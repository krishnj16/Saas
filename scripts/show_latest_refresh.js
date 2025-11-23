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
    const res = await client.query(
      'SELECT id, user_id, issued_at, last_used_at, expires_at, revoked FROM user_refresh_tokens ORDER BY id DESC LIMIT 5'
    );
    console.table(res.rows);
  } catch (err) {
    logger.error('Error querying user_refresh_tokens:', err.message || err);
    process.exitCode = 2;
  } finally {
    await client.end();
  }
})();
