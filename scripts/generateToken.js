require('dotenv').config();
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
  });

  try {
    const { rows } = await pool.query('SELECT id, email, user_uuid FROM "User" LIMIT 1;');
    if (!rows.length) {
      logger.error(' No users found in the database.');
      process.exit(1);
    }

    const user = rows[0];
    const secret = process.env.JWT_SECRET || 'dev-secret';

    const token = jwt.sign(
      { id: user.user_uuid, email: user.email },
      secret,
      { expiresIn: '8h' }
    );

    logger.info(' User chosen for token:', { id: user.id, email: user.email, user_uuid: user.user_uuid });
    logger.info(' JWT Token:\n', token);
  } catch (err) {
    logger.error(' Error generating token:', err && err.stack ? err.stack : err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
