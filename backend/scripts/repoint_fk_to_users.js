
const pool = require('../utils/db');

(async function() {
  try {
    logger.info(' Re-pointing websites.fk_websites_owner_user_uuid -> users(id)');

    await pool.query('BEGIN');

    await pool.query('ALTER TABLE websites DROP CONSTRAINT IF EXISTS fk_websites_owner_user_uuid');
    await pool.query('ALTER TABLE websites ADD CONSTRAINT fk_websites_owner_user_uuid FOREIGN KEY (owner_id) REFERENCES users(id)');

    await pool.query('COMMIT');
    logger.info(' Re-pointed fk_websites_owner_user_uuid -> users(id)');
  } catch (err) {
    try { await pool.query('ROLLBACK'); } catch (e) {}
    logger.error('Error re-pointing FK:', err.message || err);
  } finally {
    await pool.end();
  }
})();
