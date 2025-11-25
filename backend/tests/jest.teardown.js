try {
  const pool = require('../utils/db');

  module.exports = async function globalTeardown() {
    try {
      if (pool && typeof pool.end === 'function') {
        await pool.end();
      }
    } catch (e) {
    }
  };
} catch (e) {
  module.exports = async function noopTeardown() {};
}
