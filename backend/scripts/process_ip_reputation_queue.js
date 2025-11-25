// backend/scripts/process_ip_reputation_queue.js
const pool = require('../utils/db');
const { getIpReputation } = require('../services/ipReputationService');

const DEFAULT_THRESHOLD = Number(process.env.IP_REPUTATION_SCORE_THRESHOLD || 80);
const MAX_ATTEMPTS = Number(process.env.IP_REPUTATION_QUEUE_MAX_ATTEMPTS || 5);

/**
 * processRow - actual processing logic for a single queue row
 * Expects row: { id, scan_id, host_id, ip, provider, attempts, enqueued_at }
 */
async function processRow(row) {
  // call provider and store result (getIpReputation will also write ip_reputation_results)
  const { result, error } = await getIpReputation(row.ip, row.provider, false);

  // update scan_summary and create notification if high-risk
  const client = pool;
  try {
    // Add ip reputation into scan_summary.ip_reputation_summary JSONB (upsert style)
    if (row.scan_id) {
      const payload = { ip: row.ip, provider: row.provider, score: result.score, created_at: result.created_at };
      // Depending on schema, update scan_summary or a custom column - do a defensive update attempt
      await client.query(
        `UPDATE scan_summary
         SET ip_reputation = COALESCE(ip_reputation, '{}'::jsonb) || jsonb_build_object($1, $2)
         WHERE scan_id = $3`,
        [row.ip, payload, row.scan_id]
      );
    }

    // Create notification if score > threshold
    const threshold = DEFAULT_THRESHOLD;
    if (typeof result?.score === 'number' && result.score > threshold) {
      await client.query(
        `INSERT INTO notifications (scan_id, host_ip, severity, message, created_at)
         VALUES ($1,$2,$3,$4, now())`,
        [row.scan_id, row.ip, 'high', `IP reputation high risk (score=${result.score})`]
      );
    }

    // mark queue row done
    await client.query(`UPDATE ip_reputation_queue SET status='done', processed_at=now() WHERE id = $1`, [row.id]);
  } catch (err) {
    // record failure
    try {
      await client.query(`UPDATE ip_reputation_queue SET status='failed', attempts = attempts + 1, last_error = $2 WHERE id = $1`, [row.id, String(err).slice(0, 1000)]);
    } catch (e) {}
    throw err;
  }
}

/**
 * processOne - pick one pending queue item (FOR UPDATE SKIP LOCKED) and process it
 */
async function processOne() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sel = await client.query(
      `SELECT id, scan_id, host_id, ip, provider, attempts, enqueued_at
       FROM ip_reputation_queue
       WHERE status = 'pending'
       ORDER BY enqueued_at
       LIMIT 1
       FOR UPDATE SKIP LOCKED`
    );
    if (sel.rowCount === 0) {
      await client.query('COMMIT');
      return null;
    }
    const row = sel.rows[0];
    // increment attempts and mark processing
    await client.query(`UPDATE ip_reputation_queue SET status='processing', attempts = attempts + 1 WHERE id = $1`, [row.id]);
    await client.query('COMMIT');

    // process outside transaction (to avoid long locks)
    await processRow(row);
    return row;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw err;
  } finally {
    try { client.release(); } catch (e) {}
  }
}

module.exports = { processOne, processRow };
