const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const pool = require('../utils/db');

(async () => {
  try {
    const { rows } = await pool.query(`
      SELECT url, action_url, param_name, input_type, sample_value
      FROM scan_discovery
      ORDER BY discovered_at DESC
      LIMIT 15
    `);

    if (rows.length === 0) {
      console.log('  No discoveries found. Try running:');
      console.log('   node scripts/run_discovery_debug.js https://example.com');
      return;
    }

    console.log(' Showing latest discovered inputs:');
    console.table(rows);
  } catch (err) {
    console.error(' Error fetching discoveries:', err.message);
  } finally {
    pool.end();
  }
})();
