// backend/services/vtCache.js
const { pool } = require('../utils/db');

async function getFromCache(key) {
  const res = await pool.query(`
    SELECT response, last_checked FROM vt_cache WHERE key = $1 LIMIT 1
  `, [key]);
  if (!res.rowCount) return null;
  return res.rows[0];
}

async function saveToCache(key, response) {
  await pool.query(`
    INSERT INTO vt_cache (key, response, last_checked)
    VALUES ($1, $2, now())
    ON CONFLICT (key) DO UPDATE SET response = EXCLUDED.response, last_checked = now()
  `, [key, response]);
}

async function fetchVirusTotalIfNeeded(hashOrUrl) {
  if (!hashOrUrl) return null;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vt_cache (
      key TEXT PRIMARY KEY,
      response JSONB,
      last_checked TIMESTAMPTZ DEFAULT now()
    );
  `);

  const cached = await getFromCache(hashOrUrl);
  if (cached) {
    return cached.response;
  }

  const vtResp = null;

  if (vtResp) {
    await saveToCache(hashOrUrl, vtResp);
  }
  return vtResp;
}

module.exports = { fetchVirusTotalIfNeeded };
