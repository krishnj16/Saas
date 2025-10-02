const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER ? String(process.env.PGUSER) : 'postgres',
  password: process.env.PGPASSWORD ? String(process.env.PGPASSWORD) : undefined,
  database: process.env.PGDATABASE ? String(process.env.PGDATABASE) : 'postgres',
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
  max: 10,
});

module.exports = pool;
