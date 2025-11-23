const pool = require('../utils/db');

(async function() {
  try {
    logger.info(' Insert missing users from user_backup into users (using user_uuid as id)');
    await pool.query('BEGIN');

    const insertSql = `
      INSERT INTO users (id, email, password, created_at)
      SELECT b.user_uuid::uuid, b.email, md5(random()::text || clock_timestamp()::text), NOW()
      FROM user_backup b
      WHERE b.user_uuid IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id::text = b.user_uuid::text)
      RETURNING id;
    `;

    const r = await pool.query(insertSql);
    await pool.query('COMMIT');
    logger.info(' Inserted missing users count:', r.rowCount);
    if (r.rowCount > 0) console.table(r.rows);
  } catch (err) {
    try { await pool.query('ROLLBACK'); } catch (e) {}
    logger.error(' Error inserting missing users:', err.message || err);
  } finally {
    await pool.end();
  }
})();
