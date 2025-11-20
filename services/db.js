

const knex = require('knex');

const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL || 'postgresql://postgres:Maina@123@localhost:5432/saasdb',
  pool: { min: 2, max: 10 },
});

module.exports = db;
