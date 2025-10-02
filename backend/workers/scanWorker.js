require('dotenv').config();
const { Worker, QueueScheduler } = (() => {
  try {
    return require('bullmq');
  } catch (e) {
    console.error('[worker] bullmq not installed. Install with: npm i bullmq ioredis');
    process.exit(1);
  }
})();

const pool = require('../utils/db');

const QUEUE_NAME = process.env.SCAN_QUEUE_NAME || 'scanQueue';

const connection = process.env.REDIS_URL
  ? { connectionString: process.env.REDIS_URL }
  : {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
    };

const log = (...args) => console.log(new Date().toISOString(), ...args);

let scheduler;
try {
  scheduler = new QueueScheduler(QUEUE_NAME, { connection });
  log('[worker] QueueScheduler created for', QUEUE_NAME);
} catch (err) {
  log('[worker] QueueScheduler creation failed:', err.message || err);
}
async function resolveScanTaskId(job) {
  if (job.data && job.data.scanTaskId) return job.data.scanTaskId;
  try {
    const q = 'SELECT id FROM scan_tasks WHERE queue_job_id = $1 LIMIT 1';
    const { rows } = await pool.query(q, [String(job.id)]);
    if (rows[0]) return rows[0].id;
  } catch (e) {
    log('[worker] resolveScanTaskId lookup failed:', e.message || e);
  }
  return null;
}
async function updateScanTask(scanTaskId, fields = {}) {
  const keys = Object.keys(fields);
  if (keys.length === 0) return;
  const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = keys.map((k) => fields[k]);
  const sql = `UPDATE scan_tasks SET ${sets} WHERE id = $${keys.length + 1}`;
  await pool.query(sql, [...values, scanTaskId]);
}
async function processor(job) {
  log(`[worker] Processing job ${job.id}`, job.data);
  const { websiteId, requestedBy, options } = job.data || {};
  if (!websiteId) {
    const msg = 'Missing websiteId in job data';
    log(`[worker] Job ${job.id} error:`, msg);
    throw new Error(msg);
  }
  const scanTaskId = await resolveScanTaskId(job);
  if (scanTaskId) {
    try {
      await updateScanTask(scanTaskId, { status: 'running', started_at: new Date().toISOString() });
    } catch (e) {
      log('[worker] Warning: failed to mark scan_task running:', e.message || e);
    }
  } else {
    log('[worker] Warning: no scanTaskId resolved for job', job.id);
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, url FROM websites WHERE id = $1 AND deleted_at IS NULL',
      [websiteId]
    );

    if (!rows[0]) throw new Error('Website not found');

    const website = rows[0];
    log(`[worker] Scanning ${website.url} (id=${websiteId}) — simulated`);
    await new Promise((r) => setTimeout(r, 2000));
    try {
      await pool.query('UPDATE websites SET last_scan_at = NOW() WHERE id = $1', [websiteId]);
    } catch (e) {
      log('[worker] Warning: failed updating websites.last_scan_at', e.message || e);
    }
    const resultLocation = `scans/${scanTaskId || websiteId}/result-${Date.now()}.json`;
    try {
      await pool.query(
        `INSERT INTO website_scans (website_id, status, created_at, meta) VALUES ($1, $2, NOW(), $3)`,
        [websiteId, 'completed', JSON.stringify({ requestedBy, jobId: job.id })]
      );
    } catch (e) {
      log('[worker] Warning: could not insert into website_scans:', e.message || e);
    }
    if (scanTaskId) {
      try {
        await updateScanTask(scanTaskId, {
          status: 'done',
          finished_at: new Date().toISOString(),
          result_location: resultLocation,
        });
      } catch (e) {
        log('[worker] Warning: failed to mark scan_task done:', e.message || e);
      }
    }

    log(`[worker] Job ${job.id} completed for website ${websiteId}`);
    return { ok: true, resultLocation };
  } catch (err) {
    log(`[worker] Job ${job.id} failed:`, err.message || err);
    if (scanTaskId) {
      try {
        const metaUpdateSql = `
          UPDATE scan_tasks
          SET status = 'failed',
              finished_at = $1,
              meta = jsonb_strip_nulls(COALESCE(meta, '{}'::jsonb) || $2::jsonb)
          WHERE id = $3
        `;
        const errMeta = { last_error: String(err.message || err) };
        await pool.query(metaUpdateSql, [new Date().toISOString(), JSON.stringify(errMeta), scanTaskId]);
      } catch (e) {
        log('[worker] Warning: failed to mark scan_task failed:', e.message || e);
      }
    }
    throw err;
  }
}
const worker = new Worker(QUEUE_NAME, processor, {
  connection,
  concurrency: Number(process.env.WORKER_CONCURRENCY || 2),
});

worker.on('completed', (job) => log(`[worker] Completed job ${job.id}`));
worker.on('failed', (job, err) => log(`[worker] Failed job ${job.id}:`, err?.message || err));
worker.on('error', (err) => log('[worker] error:', err?.message || err));

async function shutdown() {
  log('[worker] Shutting down...');
  try { await worker.close(); } catch (e) {  }
  try { if (scheduler && scheduler.close) await scheduler.close(); } catch (e) {  }
  try { if (pool && pool.end) await pool.end(); } catch (e) {  }
  log('[worker] Shutdown complete');
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

log(`[worker] started queue=${QUEUE_NAME} redis=${process.env.REDIS_URL || `${connection.host}:${connection.port}`}`);
