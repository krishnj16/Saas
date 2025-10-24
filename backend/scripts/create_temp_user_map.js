
const pool = require('../utils/db');

(async function() {
  try {
    console.log(' Creating temp_user_map from user_backup -> users by email...');
    await pool.query('BEGIN');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS temp_user_map (
        user_uuid_text text PRIMARY KEY,
        user_id_text text
      )
    `);
    await pool.query('TRUNCATE temp_user_map');

    const r = await pool.query(`
      INSERT INTO temp_user_map (user_uuid_text, user_id_text)
      SELECT DISTINCT b.user_uuid::text, u.id::text
      FROM user_backup b
      JOIN users u ON u.email = b.email
      WHERE b.user_uuid IS NOT NULL AND u.id IS NOT NULL
    `);

    await pool.query('COMMIT');
    console.log(' temp_user_map populated, rows inserted:', r.rowCount);
  } catch (err) {
    try { await pool.query('ROLLBACK'); } catch(e) {}
    console.error(' Error creating temp_user_map:', err.message || err);
  } finally {
    await pool.end();
  }
})();
