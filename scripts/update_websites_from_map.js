const pool = require('../utils/db');

(async function() {
  try {
    logger.info('Updating websites.owner_id using temp_user_map...');
    await pool.query('BEGIN');

    const r = await pool.query(`
      UPDATE websites w
      SET owner_id = m.user_id_text::uuid
      FROM temp_user_map m
      WHERE w.owner_id::text = m.user_uuid_text
      RETURNING w.id
    `);

    await pool.query('COMMIT');
    logger.info('Updated websites.owner_id rows count:', r.rowCount);
    if (r.rowCount) console.table(r.rows);
  } catch (err) {
    try { await pool.query('ROLLBACK'); } catch(e) {}
    logger.error('Error updating websites:', err.message || err);
  } finally {
    await pool.end();
  }
})();
