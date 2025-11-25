const dns = require('dns').promises;
const pool = require('../utils/db');

function isIPLike(s) {
  return /^[0-9a-fA-F:.]+$/.test(s);
}


async function resolveAndEnqueueIPs(scanId, hosts = [], provider = 'ipqs') {
  if (!Array.isArray(hosts)) hosts = [hosts];
  const client = await pool.connect();
  const uniqueIps = new Set();
  try {
    await client.query('BEGIN');

    for (const host of hosts) {
      let ips = [];
      if (isIPLike(host)) {
        ips = [host];
      } else {
        try {
          ips = await dns.resolve(host);
        } catch (e) {
          ips = [];
        }
      }

      for (const ip of ips) {
        uniqueIps.add(ip);
        const insertScanIp = await client.query(
          `INSERT INTO scan_ips (scan_id, host, ip, created_at) VALUES ($1,$2,$3, now()) RETURNING id`,
          [scanId, host, ip]
        );
        const hostId = insertScanIp.rows && insertScanIp.rows[0] && insertScanIp.rows[0].id;
        await client.query(
          `INSERT INTO ip_reputation_queue (scan_id, host_id, ip, provider, status, attempts, enqueued_at)
           VALUES ($1,$2,$3,$4,'pending',0, now())`,
          [scanId, hostId, ip, provider]
        );
      }
      if (ips.length === 0) {
        await client.query(`INSERT INTO scan_ips (scan_id, host, ip, created_at) VALUES ($1,$2,$3, now())`, [scanId, host, null]);
      }
    }

    await client.query('COMMIT');
    return uniqueIps.size;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    try { client.release(); } catch (e) {}
  }
}

module.exports = { resolveAndEnqueueIPs };
