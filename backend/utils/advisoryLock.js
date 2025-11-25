const { pool } = require('./db');

function websiteAdvisoryKey(websiteId) {
  
  const crypto = require('crypto');
  const h = crypto.createHash('sha256').update(websiteId).digest().readUInt32BE(0);
  return h;
}

async function withAdvisoryLock(websiteId, fn) {
  const key = websiteAdvisoryKey(websiteId);
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [key]);
    const res = await fn(client);
    await client.query('SELECT pg_advisory_unlock($1)', [key]);
    client.release();
    return res;
  } catch (err) {
    try { await client.query('SELECT pg_advisory_unlock($1)', [key]); } catch(e){/*ignore*/}
    client.release();
    throw err;
  }
}

module.exports = { withAdvisoryLock };
