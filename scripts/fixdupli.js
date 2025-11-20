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
  console.log('connecting to db...');
  try {
    console.log('step1: add deleted_at col if not exists');
    await pool.query(`
      ALTER TABLE websites
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
    `);

    console.log('step2: check dupes (active only)');
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
      console.log('no dupes, safe for index');
    } else {
      console.log(`found ${dupRes.rows.length} dupe groups...`);
      for (const row of dupRes.rows) {
        const { owner_id, url } = row;
        console.log(`- fixing dupes for owner=${owner_id}, url=${url}`);

        const rows = await pool.query(
          `SELECT id, created_at FROM websites
           WHERE owner_id = $1 AND url = $2 AND deleted_at IS NULL
           ORDER BY created_at DESC`,
          [owner_id, url]
        );

        if (rows.rows.length <= 1) {
          console.log('  nothing to do here');
          continue;
        }

        const keepId = rows.rows[0].id;
        const toDelete = rows.rows.slice(1).map(r => r.id);

        console.log(`  keep id=${keepId}, soft-delete ${toDelete.length} others`);
        await pool.query(
          `UPDATE websites
           SET deleted_at = now()
           WHERE id = ANY($1::uuid[])`,
          [toDelete]
        );
        console.log(`  done. deleted ids: ${toDelete.join(', ')}`);
      }
    }

    console.log('step3: make unique index (owner_id,url where not deleted)...');
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_websites_owner_url_not_deleted
        ON websites (owner_id, url)
        WHERE deleted_at IS NULL;
    `);
    console.log('unique index ok');

    console.log('step4: add helper index (owner_id where not deleted)...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_websites_active_not_deleted
        ON websites (owner_id)
        WHERE deleted_at IS NULL;
    `);
    console.log('helper index ok');

    console.log('done. dupes cleaned + indexes ready.');
  } catch (err) {
    console.error('migration failed:', err);
  } finally {
    await pool.end();
  }
}

run();
