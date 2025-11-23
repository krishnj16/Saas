const fs = require('fs');
const path = require('path');


require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const db = require('../utils/db');

async function runSql(client, sql) {
  const res = await client.query(sql);
  return res;
}

async function main() {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const files = [
    'create_scan_outputs.sql',
    'create_vulnerabilities.sql',
  ];
  for (const f of files) {
    const p = path.join(migrationsDir, f);
    if (!fs.existsSync(p)) {
      logger.error('Migration file not found:', p);
      process.exit(1);
    }
  }

  const sqls = files.map(f => fs.readFileSync(path.join(migrationsDir, f), 'utf8'));

  try {
    if (db && db.pool && typeof db.pool.connect === 'function') {
      const client = await db.pool.connect();
      try {
        for (const sql of sqls) {
          logger.info('Applying migration chunk (via pool)...');
          await client.query(sql);
        }
      } finally {
        client.release();
      }
      logger.info('Migrations applied (via pool).');
      process.exit(0);
    }
    if (db && typeof db.getClient === 'function') {
      const client = await db.getClient();
      try {
        for (const sql of sqls) {
          await client.query(sql);
        }
      } finally {
        if (typeof client.release === 'function') client.release();
      }
      logger.info('Migrations applied (via getClient).');
      process.exit(0);
    }

    if (db && db.client && typeof db.client.query === 'function') {
      for (const sql of sqls) {
        await db.client.query(sql);
      }
      logger.info('Migrations applied (via db.client).');
      process.exit(0);
    }

    if (db && typeof db.query === 'function') {
      for (const sql of sqls) {
        await db.query(sql);
      }
      logger.info('Migrations applied (via db.query).');
      process.exit(0);
    }

    throw new Error('Unsupported db export shape from backend/utils/db.js. Expected .pool, .getClient(), .client or .query(). Paste backend/utils/db.js here if you need help.');
  } catch (err) {
    logger.error('Error applying migrations:', err);
    process.exit(1);
  }
}

if (require.main === module) main();
