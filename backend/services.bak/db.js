const { Pool } = require('pg');
const config = require('./config');

let poolConfig;
if (config.DATABASE_URL) {
  poolConfig = { connectionString: config.DATABASE_URL };
} else {
  poolConfig = {
    host: config.DB_HOST,
    port: config.DB_PORT,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
  };
}

if (config.NODE_ENV === 'test') {
  poolConfig.max = 2;
  poolConfig.idleTimeoutMillis = 1000;
}

const pool = new Pool(poolConfig);

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
};
