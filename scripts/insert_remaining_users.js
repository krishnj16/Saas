
const pool = require('../utils/db');

(async function() {
  try {
    console.log('➡️ Inserting remaining users from user_backup where safe (no email conflict)');
    await pool.query('BEGIN');

    const insertSql = `
      INSERT INTO users (id, email, password, created_at)
      SELECT b.user_uuid::uuid, b.email,
             md5(random()::text || clock_timestamp()::text), NOW()
      FROM user_backup b
      WHERE b.user_uuid IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id::text = b.user_uuid::text)
        AND NOT EXISTS (SELECT 1 FROM users u WHERE u.email = b.email)
      RETURNING id
    `;

    const r = await pool.query(insertSql);
    await pool.query('COMMIT');
    console.log(' Inserted users from user_backup (no email conflicts). Count:', r.rowCount);
    if (r.rowCount) console.table(r.rows);
  } catch (err) {
    try { await pool.query('ROLLBACK'); } catch(e) {}
    console.error(' Error inserting remaining users:', err.message || err);
  } finally {
    await pool.end();
  }
})();
