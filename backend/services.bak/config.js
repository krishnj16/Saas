
const path = require('path');
const dotenv = require('dotenv');

const env = process.env.NODE_ENV || 'development';

if (env === 'test') {
  dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env.test') });
} else {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

const DATABASE_URL = process.env.DATABASE_URL || process.env.DATABASE_URL;
const DB_HOST = process.env.DB_HOST || process.env.DATABASE_HOST || process.env.PGHOST || 'localhost';
const DB_PORT = process.env.DB_PORT || process.env.DATABASE_PORT || process.env.PGPORT || 5432;
const DB_USER = process.env.DB_USER || process.env.DATABASE_USER || process.env.PGUSER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD || 'postgres';
const DB_NAME = process.env.DB_NAME || process.env.DATABASE_NAME || process.env.POSTGRES_DB || 'testdb';

module.exports = {
  NODE_ENV: env,
  DATABASE_URL,
  DB_HOST,
  DB_PORT: Number(DB_PORT),
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  JWT_SECRET: process.env.JWT_SECRET || 'replace-me',
};
