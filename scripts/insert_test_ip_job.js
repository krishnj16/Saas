require('dotenv').config();
const pool = require('../utils/db');

async function run() {
  const client = await pool.connect();
  try {
    const scanId = '00000000-0000-0000-0000-000000000000'; 
    const host = 'example.com';
    const ip = '8.8.8.8';
    const provider = 'ipqs';

    await client.query('BEGIN');

    
    const insertScanIpSql = `
      INSERT INTO scan_ips (scan_id, host, ip, created_at)
      VALUES ($1,$2,$3, now())
      ON CONFLICT (scan_id, ip)
      DO UPDATE SET host = EXCLUDED.host
      RETURNING id
    `;
    const resScan = await client.query(insertScanIpSql, [scanId, host, ip]);
    const hostId = resScan.rows[0].id;
    const qCheck = await client.query(
      `SELECT id FROM ip_reputation_queue WHERE scan_id = $1 AND ip = $2 AND status IN ('pending','processing') LIMIT 1`,
      [scanId, ip]
    );

    if (qCheck.rowCount === 0) {
      await client.query(
        `INSERT INTO ip_reputation_queue (scan_id, host_id, ip, provider, status, attempts, enqueued_at)
         VALUES ($1,$2,$3,$4,'pending',0, now())`,
        [scanId, hostId, ip, provider]
      );
      logger.info('Inserted test job for', ip);
    } else {
      logger.info('A pending/processing job already exists for', ip, '- not enqueuing again.');
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(()=>{});
    logger.error('insert failed', err);
  } finally {
    try { client.release(); } catch (e) {}
    try { await pool.end(); } catch (e) {}
  }
}

run();
