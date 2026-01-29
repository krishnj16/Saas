require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.PG_CONNECTION_STRING || undefined,
  host: process.env.PGHOST,
  port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

async function run() {
  logger.info('connecting to db...');
  try {
    logger.info('step1: add deleted_at col if not exists');
    await pool.query(`
      ALTER TABLE websites
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
    `);

    logger.info('step2: check dupes (active only)');
    const dupQuery = `
      SELECT owner_id, url, COUNT(*) as cnt
      FROM websites
      WHERE deleted_at IS NULL
      GROUP BY owner_id, url
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC
      LIMIT 1000;
    `;
    const dupRes = await pool.query(dupQuery);

    if (dupRes.rows.length === 0) {
      logger.info('no dupes, safe for index');
    } else {
      logger.info(`found ${dupRes.rows.length} dupe groups...`);
      for (const row of dupRes.rows) {
        const { owner_id, url } = row;
        logger.info(`- fixing dupes for owner=${owner_id}, url=${url}`);

        const rows = await pool.query(
          `SELECT id, created_at FROM websites
           WHERE owner_id = $1 AND url = $2 AND deleted_at IS NULL
           ORDER BY created_at DESC`,
          [owner_id, url]
        );

        if (rows.rows.length <= 1) {
          logger.info('  nothing to do here');
          continue;
        }

        const keepId = rows.rows[0].id;
        const toDelete = rows.rows.slice(1).map(r => r.id);

        logger.info(`  keep id=${keepId}, soft-delete ${toDelete.length} others`);
        await pool.query(
          `UPDATE websites
           SET deleted_at = now()
           WHERE id = ANY($1::uuid[])`,
          [toDelete]
        );
        logger.info(`  done. deleted ids: ${toDelete.join(', ')}`);
      }
    }

    logger.info('step3: make unique index (owner_id,url where not deleted)...');
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_websites_owner_url_not_deleted
        ON websites (owner_id, url)
        WHERE deleted_at IS NULL;
    `);
    logger.info('unique index ok');

    logger.info('step4: add helper index (owner_id where not deleted)...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_websites_active_not_deleted
        ON websites (owner_id)
        WHERE deleted_at IS NULL;
    `);
    logger.info('helper index ok');

    logger.info('done. dupes cleaned + indexes ready.');
  } catch (err) {
    logger.error('migration failed:', err);
  } finally {
    await pool.end();
  }
}

run();
