require('dotenv').config();
const { Pool } = require('pg');
const { getIpReputation } = require('../services/ipReputationService');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runOne() {
  const client = await pool.connect();
  try {
    logger.info('[ipReputation] Fetching one pending job...');
    const res = await client.query(
      `SELECT * FROM ip_reputation_queue WHERE status='pending' ORDER BY id ASC LIMIT 1`
    );

    if (res.rowCount === 0) {
      logger.info('No pending jobs found.');
      return;
    }

    const job = res.rows[0];
    logger.info(`[ipReputation] Processing job id=${job.id}, ip=${job.ip}, provider=${job.provider}`);

    await client.query(
      `UPDATE ip_reputation_queue SET status='processing', attempts = attempts + 1 WHERE id=$1`,
      [job.id]
    );

    const result = await getIpReputation(job.ip, job.provider, true);

    await client.query(
      `UPDATE ip_reputation_queue SET status='done', processed_at=now() WHERE id=$1`,
      [job.id]
    );

    logger.info(
      `[ipReputation] Done — ip=${job.ip} score=${result?.result?.score ?? 'n/a'} cached=${
        result.cached ? 'yes' : 'no'
      }`
    );
  } catch (err) {
    logger.error('[ipReputation] Error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

runOne();
