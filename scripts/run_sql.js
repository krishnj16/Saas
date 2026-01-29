require('dotenv').config({ path: './backend/.env' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

(async () => {
  const sqlFile = process.argv[2];
  if (!sqlFile) {
    logger.error('Usage: node scripts/run_sql.js <path_to_sql_file>');
    process.exit(1);
  }

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'Maina@123', 
    database: process.env.DB_NAME || 'saasdb',
  });

  const fullPath = path.resolve(sqlFile);
  const sql = fs.readFileSync(fullPath, 'utf8');

  try {
    await client.connect();
    logger.info('Connected to DB');
    logger.info(`Running SQL from ${fullPath}`);
    await client.query(sql);
    logger.info('Migration executed successfully');
  } catch (err) {
    logger.error('Error:', err.message);
  } finally {
    await client.end();
  }
})();
