const { Pool } = require('pg');
require('dotenv').config();
logger.info('DEBUG DB ENV:', {
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD ? '***set***' : 'MISSING',
  db: process.env.PGDATABASE,
  url: process.env.DATABASE_URL
});


const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.PG_CONNECTION_STRING,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
};
