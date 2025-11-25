// const path = require('path');

// require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

// const { Pool } = require('pg');

// const pool = new Pool({
//   host: process.env.PGHOST || 'localhost',
//   user: process.env.PGUSER ? String(process.env.PGUSER) : 'postgres',
//   password: process.env.PGPASSWORD ? String(process.env.PGPASSWORD) : undefined,
//   database: process.env.PGDATABASE ? String(process.env.PGDATABASE) : 'postgres',
//   port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
//   max: 10,
// });

// module.exports = pool;
// backend/utils/db.js
// Minimal pg Pool wrapper used by worker & migrations.
// Reads DATABASE_URL or individual PG env vars from .env.
//
// Usage:
// const pool = require('./backend/utils/db');
// await pool.query('SELECT 1');
// await pool.end();

// backend/utils/db.js
// PostgreSQL pool configuration
// Loads .env from backend/.env (since your .env is stored there)
//
// Usage example:
// const pool = require('../utils/db');
// const res = await pool.query('SELECT NOW()');

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); 

const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || null;
const poolConfig = connectionString
  ? { connectionString }
  : {
      user: process.env.PGUSER || process.env.DB_USER || 'root',
      password: process.env.PGPASSWORD || process.env.DB_PASS || process.env.DB_PASSWORD || 'admin',
      host: process.env.PGHOST || process.env.DB_HOST || '127.0.0.1',
      port: process.env.PGPORT ? Number(process.env.PGPORT) : (process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432),
      database: process.env.PGDATABASE || process.env.DB_NAME || 'saas',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  logger.error('[db] Unexpected error on idle client:', err?.message || err);
});

module.exports = pool;


