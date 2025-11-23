
require('dotenv').config({ path: './.env' });
const fs = require('fs');
const path = require('path');
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
    const tables = [
      'users',
      'user_refresh_tokens',
      'websites',
      'scan_outputs',
      'notifications'
    ];

    const backup = {};
    for (const t of tables) {
      try {
        const res = await client.query(`SELECT * FROM ${t}`);
        backup[t] = res.rows;
      } catch (e) {
        backup[t] = { error: e.message };
      }
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.resolve('./backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    const filePath = path.join(backupDir, `saasdb_${timestamp}.json`);
    fs.writeFileSync(filePath, JSON.stringify(backup, null, 2));
    logger.info('Backup saved to', filePath);
  } catch (err) {
    logger.error('Backup failed:', err.message);
  } finally {
    await client.end();
  }
})();
