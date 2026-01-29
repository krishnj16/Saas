

const db = require('../utils/db');

async function saveScanOutput({ scanTaskId, scannerName, rawText }) {
  let jsonPayload;
  try {
    jsonPayload = JSON.parse(rawText);
  } catch (err) {
    jsonPayload = { raw_text: String(rawText) };
  }

  
  const runWithClient = async (client) => {
    const res = await client.query(
      `INSERT INTO scan_outputs (scan_task_id, scanner_name, raw_json)
       VALUES ($1, $2, $3) RETURNING *`,
      [scanTaskId, scannerName, jsonPayload]
    );
    return res.rows[0];
  };

  if (db && db.pool && typeof db.pool.connect === 'function') {
    const client = await db.pool.connect();
    try {
      return await runWithClient(client);
    } finally {
      client.release();
    }
  }

  if (db && typeof db.getClient === 'function') {
    const client = await db.getClient();
    try {
      return await runWithClient(client);
    } finally {
      if (typeof client.release === 'function') client.release();
    }
  }

  if (db && db.client && typeof db.client.query === 'function') {
    return await runWithClient(db.client);
  }

  if (db && typeof db.query === 'function') {
    const res = await db.query(
      `INSERT INTO scan_outputs (scan_task_id, scanner_name, raw_json)
       VALUES ($1, $2, $3) RETURNING *`,
      [scanTaskId, scannerName, jsonPayload]
    );
    return res.rows ? res.rows[0] : res[0];
  }

  
  throw new Error(
    'Database client not detected in backend/utils/db.js — expected .pool, .query or .client. Please open backend/utils/db.js and share its exports if you want help adapting.'
  );
}

module.exports = { saveScanOutput };
