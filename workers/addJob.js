const logger = require('../services/logger');
require('dotenv').config();
const { Queue } = require('bullmq');
const pool = require('../utils/db'); 

const QUEUE_NAME = process.env.SCAN_QUEUE_NAME || 'scanQueue';
const connection = process.env.REDIS_URL
  ? { connectionString: process.env.REDIS_URL }
  : {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
    };

const queue = new Queue(QUEUE_NAME, { connection });

async function createScanTaskRow(websiteId, meta = {}) {
  const sql = `
    INSERT INTO scan_tasks (website_id, status, meta)
    VALUES ($1, 'queued', $2::jsonb)
    RETURNING id, created_at
  `;
  const { rows } = await pool.query(sql, [websiteId, JSON.stringify(meta)]);
  return rows[0];
}

async function updateScanTask(scanTaskId, fields = {}) {
  const keys = Object.keys(fields);
  if (keys.length === 0) return;

  const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = Object.values(fields);
  const sql = `UPDATE scan_tasks SET ${sets} WHERE id = $${keys.length + 1}`;
  await pool.query(sql, [...values, scanTaskId]);
}

async function addScanTaskJob({ websiteId, requestedBy = 'dev@local', options = {} }) {
  if (!websiteId) throw new Error('websiteId required');

  const meta = { requestedBy, options };
  const inserted = await createScanTaskRow(websiteId, meta);
  const scanTaskId = inserted.id;
  logger.info('Created scan_tasks row id=', scanTaskId);


  const jobData = {
    scanTaskId,
    websiteId,
    requestedBy,
    options,
  };

  const job = await queue.add('scan-site', jobData, {
    removeOnComplete: true,
    removeOnFail: 1000,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  });

  logger.info('Enqueued job id=', job.id, 'for scanTaskId=', scanTaskId);

  try {
    await updateScanTask(scanTaskId, { queue_job_id: String(job.id) });
    logger.info('Updated scan_tasks.queue_job_id for', scanTaskId);
  } catch (err) {
    logger.error('Failed to update scan_tasks with queue_job_id:', err.message || err);
  }

  return { scanTaskId, jobId: job.id };
}

if (require.main === module) {
  (async () => {
    try {
      const websiteId = process.env.TEST_WEBSITE_ID;
      if (!websiteId) {
        throw new Error('Set TEST_WEBSITE_ID in .env or pass websiteId');
      }

      const res = await addScanTaskJob({ websiteId, requestedBy: 'dev@local', options: { depth: 1 } });
      logger.info('Done:', res);

      await queue.close();
      if (pool && pool.end) await pool.end();
      process.exit(0);
    } catch (err) {
      logger.error('enqueue error', err.message || err);
      try { await queue.close(); } catch (e) {}
      try { if (pool && pool.end) await pool.end(); } catch (e) {}
      process.exit(1);
    }
  })();
}

module.exports = { addScanTaskJob };
