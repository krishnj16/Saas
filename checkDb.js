
require('dotenv').config({ path: './backend/.env' });
const { Pool } = require('pg');

function maskUrl(u) {
  if (!u) return null;
  return u.replace(/:\/\/([^:\/]+):([^@]+)@/, '://$1:***@');
}

const u = process.env.DATABASE_URL || '';
console.log('DATABASE_URL present ->', !!u);
if (u) console.log('masked ->', maskUrl(u));

try {
  if (u) {
    const url = new URL(u);
    console.log('parsed ->', {
      user: url.username || null,
      password: url.password ? '***' : null,
      host: url.hostname || null,
      port: url.port || '5432',
      database: url.pathname ? url.pathname.replace('/', '') : null,
      startsWithQuote: /^["']/.test(u.trim()),
      endsWithQuote: /["']$/.test(u.trim()),
    });
  } else {
    console.log('parsed -> no DATABASE_URL to parse (check backend/.env)');
  }
} catch (e) {
  console.log('PARSE_ERROR ->', e.message);
  console.log('raw preview ->', (u || '').slice(0, 160));
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
    console.log('DB OK ->', r.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('DB ERROR ->', err.message);
    process.exit(1);
  } finally {
    try { await pool.end(); } catch (e) {}
  }
})();
