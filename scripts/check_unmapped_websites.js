// backend/scripts/check_unmapped_websites.js
// Shows websites rows that are NOT covered by temp_user_map
const pool = require('../utils/db');

(async function() {
  try {
    logger.info('➡️ Checking unmapped websites (owner_id not found in temp_user_map)...');
    const sql = `
      SELECT id, owner_id::text AS owner_id
      FROM websites w
      WHERE NOT EXISTS (
        SELECT 1 FROM temp_user_map m WHERE m.user_uuid_text = w.owner_id::text
      )
      LIMIT 50
    `;
    const r = await pool.query(sql);
    console.table(r.rows);
    if (r.rows.length === 0) {
      logger.info('✅ No unmapped websites found (temp_user_map covers them).');
    } else {
      logger.info('⚠️ Found unmapped websites above. Inspect and decide mapping policy.');
    }
  } catch (err) {
    logger.error('❌ Error checking unmapped websites:', err.message || err);
  } finally {
    await pool.end();
  }
})();
