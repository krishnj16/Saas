let pool = null;
try {
  pool = require('../utils/db');
} catch (e) {
  pool = null;
}

afterAll(async () => {
  try {
    if (pool && typeof pool.end === 'function') {
      await pool.end();
    }
  } catch (e) {
  }
});
