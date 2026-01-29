
require('dotenv').config({ path: './backend/.env' });
const { Pool } = require('pg');

function maskUrl(u) {
  if (!u) return null;
  return u.replace(/:\/\/([^:\/]+):([^@]+)@/, '://$1:***@');
}

const u = process.env.DATABASE_URL || '';
logger.info('DATABASE_URL present ->', !!u);
if (u) logger.info('masked ->', maskUrl(u));

try {
  if (u) {
    const url = new URL(u);
    logger.info('parsed ->', {
      user: url.username || null,
      password: url.password ? '***' : null,
      host: url.hostname || null,
      port: url.port || '5432',
      database: url.pathname ? url.pathname.replace('/', '') : null,
      startsWithQuote: /^["']/.test(u.trim()),
      endsWithQuote: /["']$/.test(u.trim()),
    });
  } else {
    logger.info('parsed -> no DATABASE_URL to parse (check backend/.env)');
  }
} catch (e) {
  logger.info('PARSE_ERROR ->', e.message);
  logger.info('raw preview ->', (u || '').slice(0, 160));
}

(async () => {
  const pool = u ? new Pool({ connectionString: u }) : new Pool({
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    host: process.env.PGHOST || '127.0.0.1',
    port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
    database: process.env.PGDATABASE,
  });

  try {
    const r = await pool.query('SELECT NOW()');
    logger.info('DB OK ->', r.rows[0]);
    process.exit(0);
  } catch (err) {
    logger.error('DB ERROR ->', err.message);
    process.exit(1);
  } finally {
    try { await pool.end(); } catch (e) {}
  }
})();
