const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const logger = console;  

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });


const migrationsDir = path.join(__dirname, '..', 'migrations');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

async function ensureSchemaMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);
}

async function appliedMigrations() {
  const res = await pool.query(`SELECT filename FROM schema_migrations`);
  return new Set(res.rows.map(r => r.filename));
}

async function applyMigration(filename) {
  const fullPath = path.join(migrationsDir, filename);
  const sql = fs.readFileSync(fullPath, 'utf8');
  logger.info('Applying', filename);
  try {
    await pool.query('BEGIN');
    await pool.query(sql);
    await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
    await pool.query('COMMIT');
    logger.info('Applied', filename);
  } catch (err) {
    await pool.query('ROLLBACK');
    logger.error('Failed to apply', filename, err);
    throw err;
  }
}

async function run() {
  try {
    await ensureSchemaMigrations();
    const applied = await appliedMigrations();
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); 

    for (const f of files) {
      if (!applied.has(f)) {
        await applyMigration(f);
      } else {
        logger.info('Skipping already applied', f);
      }
    }
    logger.info('All migrations done');
  } catch (err) {
    logger.error('Migration runner failed', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
