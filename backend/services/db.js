// backend/services/db.js
// knex + pg wrapper that works both as function (db('table')) and provides query/pool

const knex = require('knex');
const { Pool } = require('pg');
const config = require('./config');

// create a pg Pool for raw queries if needed
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || config.DATABASE_URL,
});

// create knex instance for query builder usage (tests expect db('table'))
const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL || config.DATABASE_URL,
  pool: { min: 0, max: 7 },
});

// helper query function that some modules use
async function query(text, params = []) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}

// Export the knex function but attach query/pool for code that expects them.
// Common usage: const db = require('../services/db'); db('table')... and db.query(...)
module.exports = db;
module.exports.query = query;
module.exports.pool = pool;
module.exports.knex = db;
