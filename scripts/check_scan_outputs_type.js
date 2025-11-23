require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../utils/db');

(async () => {
  const query =
    (db.pool && db.pool.query && db.pool.query.bind(db.pool)) ||
    (db.query && db.query.bind(db)) ||
    (db.client && db.client.query && db.client.query.bind(db.client));

  const res = await query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name='scan_outputs' AND column_name='scan_task_id';
  `);
  logger.info(res.rows || res);
  process.exit(0);
})();
