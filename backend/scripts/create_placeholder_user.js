
const pool = require('../utils/db');

(async function() {
  try {
    const placeholderId = 'd573b3c8-16dd-42e7-a9d5-690b69d215b1';
    logger.info(' Creating placeholder user with id:', placeholderId);

    await pool.query('BEGIN');

    const r = await pool.query(`
      INSERT INTO users (id, email, password, created_at)
      VALUES ($1, $2, md5(random()::text || clock_timestamp()::text), NOW())
      ON CONFLICT (id) DO NOTHING
      RETURNING id
    `, [placeholderId, `placeholder_${Date.now()}@example.com`]);

    await pool.query('COMMIT');
    logger.info(' Placeholder user inserted (if not existing).');
    if (r.rowCount) console.table(r.rows);
    else logger.info('ℹ User already existed, no new row added.');
  } catch (err) {
    try { await pool.query('ROLLBACK'); } catch (e) {}
    logger.error(' Error creating placeholder user:', err.message || err);
  } finally {
    await pool.end();
  }
})();
