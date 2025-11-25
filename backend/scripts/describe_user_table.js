(async function main() {
  try {
    const pool = require('../utils/db'); 
    const sql = `
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'User'
      ORDER BY ordinal_position;
    `;
    const res = await pool.query(sql);
    console.table(res.rows);
    await pool.end();
  } catch (err) {
    logger.error('ERROR:', err.message || err);
    process.exit(1);
  }
})();
