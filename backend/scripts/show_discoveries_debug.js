const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

logger.info('--- show_discoveries_debug starting ---');

let pool;
try {
  pool = require('../utils/db');
  logger.info('DB module loaded from ../utils/db');
} catch (e) {
  logger.error(' Could not require ../utils/db - file missing or path wrong.');
  logger.error('Error:', e && e.message);
  process.exit(1);
}

(async () => {
  try {
    logger.info('ENV PREVIEW:', {
      PGHOST: process.env.PGHOST,
      PGPORT: process.env.PGPORT,
      PGUSER: process.env.PGUSER,
      PGDATABASE: process.env.PGDATABASE,
      PGPASSWORD: !!process.env.PGPASSWORD ? '***' : undefined,
      REDIS_HOST: process.env.REDIS_HOST,
      PUPPETEER_HEADLESS: process.env.PUPPETEER_HEADLESS
    });

    try {
      const v = await pool.query('SELECT version() as v');
      logger.info('DB connected. Postgres version:', v.rows[0].v);
    } catch (e) {
      logger.error(' DB connection/query failed. Check DB credentials and network.');
      logger.error('Error message:', e && e.message);
      process.exit(1);
    }

    const t = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1",
      ['scan_discovery']
    );
    if (!t.rows.length) {
      logger.error(' Table scan_discovery NOT FOUND. Run migration script.');
      logger.error('Run: node scripts/run_migration.js');
      process.exit(1);
    }
    logger.info(' Table scan_discovery exists');

    const cnt = await pool.query('SELECT COUNT(*)::int as c FROM scan_discovery');
    logger.info('Row count in scan_discovery =', cnt.rows[0].c);

    const { rows } = await pool.query(`
      SELECT id, discovered_at, url, action_url, param_name, input_type, sample_value, is_hidden, is_csrf, extra
      FROM scan_discovery
      ORDER BY discovered_at DESC
      LIMIT 10
    `);
    if (!rows.length) {
      logger.warn(' No discovery rows found yet. Run discovery debug: node scripts/run_discovery_debug.js https://example.com');
    } else {
      logger.info(' Latest discoveries:');
      console.table(rows.map(r => ({
        id: r.id,
        discovered_at: r.discovered_at,
        url: r.url,
        action_url: r.action_url,
        param: r.param_name,
        type: r.input_type,
        sample: r.sample_value,
        hidden: r.is_hidden,
        csrf: r.is_csrf
      })));
    }

  } catch (err) {
    logger.error(' Unexpected error:', err && err.message);
    logger.error(err);
  } finally {
    try { pool.end(); } catch (e) {}
    logger.info('--- finished ---');
  }
})();
