
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    logger.error('Usage: node scripts/migrate.js <sql-file-path>');
    process.exit(2);
  }
  const filePath = path.isAbsolute(arg) ? arg : path.join(process.cwd(), arg);
  if (!fs.existsSync(filePath)) {
    logger.error('SQL file not found:', filePath);
    process.exit(3);
  }
  const sql = fs.readFileSync(filePath, 'utf8');

  let pool;
  try {
    pool = require(path.join(process.cwd(), 'utils', 'db'));
  } catch (e) {
    logger.error('Could not load DB pool at utils/db.js. ');
    logger.error(e);
    process.exit(4);
  }

  try {
    logger.info('Running migration:', filePath);
    await pool.query(sql);
    logger.info('Migration OK');
  } catch (err) {
    logger.error('Migration failed:', err);
    process.exit(5);
  } finally {
    try { await pool.end(); } catch (e) {}
  }
}

main();
