const pool = require('../utils/db');

async function runIpReputationRule(scanId) {
  const res = await pool.query(
    `SELECT r.* FROM ip_reputation_results r
     JOIN scan_ips s ON s.ip = r.ip
     WHERE s.scan_id = $1
     ORDER BY r.created_at DESC`,
    [scanId]
  );

  const threshold = Number(process.env.IP_REPUTATION_SCORE_THRESHOLD || '80');
  for (const row of res.rows) {
    if (row.score > threshold) {
      await pool.query(
        `INSERT INTO notifications (scan_id, host_ip, severity, message, created_at)
         VALUES ($1, $2, $3, $4, now())`,
        [scanId, row.ip, 'high', `High IP reputation risk for ${row.ip} (${row.provider}) score=${row.score}`]
      );

      await pool.query(
        `UPDATE hosts SET tags = array_append(coalesce(tags, '{}'), 'ip_reputation_high') WHERE ip = $1`,
        [row.ip]
      );
    }
  }
}

module.exports = {
  runIpReputationRule,
};
