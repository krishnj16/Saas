
const pool = require('../utils/db');

(async () => {
  try {
    const u = await pool.query('SELECT id, email FROM users LIMIT 1');
    if (!u.rows.length) {
      logger.info(' No users found. Please signup a user');
      return;
    }
    const ownerId = u.rows[0].id;
    logger.info('Using owner:', u.rows[0]);
    const insert = await pool.query(
      'INSERT INTO websites (url, owner_id) VALUES ($1, $2) RETURNING *',
      ['https://example.com', ownerId]
    );
    logger.info(' Inserted website:', insert.rows[0]);
    const all = await pool.query('SELECT * FROM websites WHERE owner_id = $1', [ownerId]);
    logger.info(' Websites for owner:', all.rows);
  } catch (err) {
    logger.error(' Error inserting/reading website:', err);
  } finally {
    try { await pool.end(); } catch (_) {}
  }
})();
