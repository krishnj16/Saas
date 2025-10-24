const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); 

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.PGHOST || '127.0.0.1',
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
  user: process.env.PGUSER || 'root',
  password: process.env.PGPASSWORD || 'admin',
  database: process.env.PGDATABASE || 'saas',
});

(async () => {
  try {
    console.log('[test_db_conn] Trying to connect to PostgreSQL...');
    const res = await pool.query('SELECT NOW() AS now;');
    console.log(`[] Connected successfully! Current time on DB server: ${res.rows[0].now}`);
  } catch (err) {
    console.error('[] Database connection failed:', err.message || err);
  } finally {
    await pool.end();
  }
})();
