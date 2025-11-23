const Sentry = require('../services/sentry');
const logger = require('../services/logger');

process.on('unhandledRejection', (reason) => {
  Sentry.captureException(reason);
  logger.error('Unhandled Rejection in scanWorker', { reason });
});

process.on('uncaughtException', (err) => {
  Sentry.captureException(err);
  logger.error('Uncaught Exception in scanWorker', { err });
});


const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const fs = require('fs');
const os = require('os');

const { downloadAndHash, cleanupFile } = require('../services/fileDownloader');
const { enqueueVTJob, getCachedResult } = require('../services/malwareService');

let Worker; let QueueScheduler;
try {
  const bull = require(path.join(process.cwd(), 'node_modules', 'bullmq'));
  Worker = bull && bull.Worker ? bull.Worker : require('bullmq').Worker;
  QueueScheduler = bull && bull.QueueScheduler ? bull.QueueScheduler : (require('bullmq').QueueScheduler || null);
} catch (e) {
  try { Worker = require('bullmq').Worker; } catch (err) { logger.error('[worker] bullmq missing - npm install --prefix . bullmq ioredis'); process.exit(1); }
}

const pool = require('../utils/db');

const { runScannerDocker } = require('../utils/runScannerDocker');
let logAudit = async () => null;
try {
  const auditMod = require('../utils/auditLogger');
  if (auditMod && typeof auditMod.logAudit === 'function') logAudit = auditMod.logAudit;
} catch (e) {
  logger.warn('[worker] auditLogger not available, continuing without audit logs');
}

let discoveryWorker = null;
try {
  discoveryWorker = require('./discoveryWorker'); 
  if (!discoveryWorker || typeof discoveryWorker.discoverForScanTask !== 'function') {
    logger.warn('[worker] discoveryWorker found but does not export discoverForScanTask');
    discoveryWorker = null;
  }
} catch (e) {
  logger.warn('[worker] discoveryWorker not present - discovery disabled for now');
  discoveryWorker = null;
}

let injector = null;
try {
  injector = require('../injector/injector'); 
  if (!injector || typeof injector.runInjectionForScan !== 'function') {
    logger.warn('[worker] injector found but does not export runInjectionForScan');
    injector = null;
  }
} catch (e) {
  logger.warn('[worker] injector not present - injection disabled for now');
  injector = null;
}

const QUEUE_NAME = process.env.SCAN_QUEUE_NAME || 'scanQueue';
const connection = process.env.REDIS_URL ? { connectionString: process.env.REDIS_URL } : { host: process.env.REDIS_HOST || '127.0.0.1', port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379 };
const log = (...a) => logger.info(new Date().toISOString(), ...a);

let scheduler = null;
if (QueueScheduler) {
  try { scheduler = new QueueScheduler(QUEUE_NAME, { connection }); log('[worker] QueueScheduler created for', QUEUE_NAME); } catch (e) { log('[worker] QueueScheduler creation failed', e.message || e); }
} else { log('[worker] QueueScheduler not available — continuing without scheduler.'); }

function buildScannerCommand(url, opts = {}) {
  const scanner = (opts.scanner || 'wpscan').toLowerCase();
  const isWindows = process.platform === 'win32';

  if (scanner === 'wapiti') {
    const image = opts.image || 'wapiti/wapiti';
    const outFile = '/out/wapiti-result.json';
    const args = isWindows ? ['-u', url, '-f', 'json'] : ['-u', url, '-f', 'json', '-o', outFile];
    return { image, args, outFile, scanner };
  }

  const image = opts.image || 'wpscanteam/wpscan';
  const outFile = '/out/wpscan-result.json';
  const args = isWindows
    ? ['--url', url, '--format', 'json']
    : ['--url', url, '--format', 'json', '--output', outFile];

  return { image, args, outFile, scanner: 'wpscan' };
}

async function createScanTask(websiteId, queuedBy) {
  try {
    const res = await pool.query(
      `INSERT INTO scan_tasks (website_id, status, queued_at, worker_id, created_at, updated_at)
       VALUES ($1, $2, NOW(), $3, NOW(), NOW()) RETURNING id`,
      [websiteId, 'queued', queuedBy || null]
    );
    return res.rows[0].id;
  } catch (e) {
    log('[worker] createScanTask failed (table may be missing):', e.message || e);
    return null;
  }
}


async function updateScanTask(taskId, updates = {}) {
  if (!taskId) return;
  const setParts = [];
  const vals = [];
  let idx = 1;
  if (updates.status) { setParts.push(`status = $${idx++}`); vals.push(updates.status); }
  if (updates.started_at) { setParts.push(`started_at = $${idx++}`); vals.push(updates.started_at); }
  if (updates.finished_at) { setParts.push(`finished_at = $${idx++}`); vals.push(updates.finished_at); }
  if (updates.worker_id) { setParts.push(`worker_id = $${idx++}`); vals.push(updates.worker_id); }
  if (setParts.length === 0) return;
  vals.push(taskId);
  const sql = `UPDATE scan_tasks SET ${setParts.join(', ')}, updated_at = NOW() WHERE id = $${idx}`;
  try {
    await pool.query(sql, vals);
  } catch (e) {
    log('[worker] updateScanTask failed:', e.message || e);
  }
}


async function insertScanOutput(scanTaskId, scannerName, rawText) {
  try {
    let rawJson = null;
    
    try {
      rawJson = rawText && rawText.trim() ? JSON.parse(rawText) : null;
    } catch (e) {
      
      const capped = typeof rawText === 'string' && rawText.length > 200000 ? rawText.slice(0, 200000) + '\n...TRUNCATED' : rawText;
      rawJson = { output_text: capped };
    }

    await pool.query(
      `INSERT INTO scan_outputs (scan_task_id, scanner_name, raw_json, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [scanTaskId, scannerName, rawJson]
    );
    log('[worker] scan_output inserted for task', scanTaskId);
  } catch (e) {
    log('[worker] insertScanOutput failed (table may be missing or payload too large):', e.message || e);
  }
}

async function processor(job) {
  log('[worker] Processing job', job.id, job.data);
  const { websiteId, requestedBy, options } = job.data || {};
  if (!websiteId) throw new Error('Missing websiteId');

  const scanTaskId = await createScanTask(websiteId, requestedBy || null);

  try {
    await logAudit(requestedBy || null, 'start_scan_task', 'scan_task', scanTaskId || job.id, {
      worker_id: `${os.hostname()}:${process.pid}`,
      queued_job_id: job.id,
      website_id: websiteId
    });
  } catch (e) {
    log('[worker] audit start failed:', e.message || e);
  }


  const { rows } = await pool.query('SELECT id, url FROM websites WHERE id = $1 AND deleted_at IS NULL', [websiteId]);
  if (!rows[0]) {
    const msg = 'Website not found';
    log('[worker]', msg, websiteId);
    await updateScanTask(scanTaskId, { status: 'failed', finished_at: new Date().toISOString() });
    try { await logAudit(requestedBy || null, 'fail_scan_task', 'scan_task', scanTaskId || job.id, { reason: msg }); } catch {}
    throw new Error(msg);
  }
  const website = rows[0];
  await updateScanTask(scanTaskId, { status: 'started', started_at: new Date().toISOString(), worker_id: `${os.hostname()}:${process.pid}` });

  if (discoveryWorker) {
    try {
      log('[worker] Running discovery for', website.url);
      await discoveryWorker.discoverForScanTask({
        scanTaskId, 
        startUrl: website.url,
        maxDepth: process.env.CRAWL_DEPTH ? parseInt(process.env.CRAWL_DEPTH, 10) : undefined,
        headless: process.env.PUPPETEER_HEADLESS !== 'false',
        puppeteerArgs: (process.env.PUPPETEER_ARGS || '').split(' ').filter(Boolean)
      });
      log('[worker] Discovery finished for', website.url);
      try { await logAudit(requestedBy || null, 'discovery_completed', 'scan_task', scanTaskId || job.id, { worker_id: `${os.hostname()}:${process.pid}` }); } catch {}
    } catch (e) {
      
      log('[worker] discovery failed for', website.url, e.message || e);
      try { await logAudit(requestedBy || null, 'discovery_failed', 'scan_task', scanTaskId || job.id, { error: e.message || String(e) }); } catch {}
    }
  } else {
    log('[worker] discoveryWorker not configured; skipping discovery step');
  }

  const { image, args: imageArgs, outFile, scanner } = buildScannerCommand(website.url, options || {});
  const tmpHostDir = fs.mkdtempSync(path.join(os.tmpdir(), `scan-${job.id}-`));
  log('[worker] Created temp mount:', tmpHostDir);

  const runnerOpts = {
    memoryMB: Number(options?.memoryMB || process.env.SCAN_DEFAULT_MEMORY_MB || 512),
    cpus: Number(options?.cpus || process.env.SCAN_DEFAULT_CPUS || 0.5),
    user: options?.user || process.env.SCAN_DEFAULT_USER || '1000:1000',
    mountHostDir: tmpHostDir,
  };
  const timeoutMs = Number(options?.timeoutMs || process.env.SCAN_DEFAULT_TIMEOUT_MS || 5 * 60 * 1000);

  log(`[worker] Running docker image=${image} args=${JSON.stringify(imageArgs)} timeoutMs=${timeoutMs} memoryMB=${runnerOpts.memoryMB} cpus=${runnerOpts.cpus}`);

  const res = await runScannerDocker(image, imageArgs, timeoutMs, runnerOpts);
  let scanOutput = res.stdout || '';
  const hostOutPath = path.join(tmpHostDir, path.basename(outFile || ''));
  if (fs.existsSync(hostOutPath)) {
    try {
      scanOutput = fs.readFileSync(hostOutPath, 'utf8');
      log('[worker] Read output file from mount:', hostOutPath);
    } catch (e) {
      log('[worker] Warning reading output file:', e.message || e);
    }
  } else if (res.outputContents) {
    scanOutput = res.outputContents;
  }

  let status = res.success ? 'completed' : 'failed';
  const notes = { requestedBy, jobId: job.id, docker: res.logs };

  if (!res.success && scanOutput && String(scanOutput).trim().length > 0) {
    status = 'completed_with_issues';
    notes.status_detail = `scanner-exit-code-${res.code || 'null'}`;
  }

  try {
    await insertScanOutput(scanTaskId, scanner || (options && options.scanner) || 'scanner', scanOutput);
  } catch (e) {
    log('[worker] Warning: insertScanOutput failed:', e.message || e);
  }
  try {
    await pool.query(
      'INSERT INTO website_scans (website_id, status, created_at, meta) VALUES ($1, $2, NOW(), $3)',
      [website.id, status, JSON.stringify({ ...notes, hasOutput: !!(scanOutput && String(scanOutput).trim().length > 0) })]
    );
    log('[worker] Inserted website_scan record with status', status);
  } catch (e) {
    log('[worker] Could not insert website_scans (table missing?):', e.message || e);
  }

  if (injector) {
    try {
      log('[worker] Starting injector for scanTask', scanTaskId);
      await injector.runInjectionForScan(scanTaskId);
      log('[worker] Injector finished for scanTask', scanTaskId);
      try { await logAudit(requestedBy || null, 'injector_completed', 'scan_task', scanTaskId || job.id, { worker_id: `${os.hostname()}:${process.pid}` }); } catch {}
    } catch (e) {
      log('[worker] injector failed for scanTask', scanTaskId, e.message || e);
      try { await logAudit(requestedBy || null, 'injector_failed', 'scan_task', scanTaskId || job.id, { error: e.message || String(e) }); } catch {}
      status = status === 'completed' ? 'completed_with_issues' : status;
    }
  } else {
    log('[worker] injector not configured; skipping injection step');
  }

  try {
    if (res.success || status !== 'failed') {
      fs.rmSync(tmpHostDir, { recursive: true, force: true });
      log('[worker] Cleaned temp mount dir:', tmpHostDir);
    } else {
      log('[worker] Keeping temp mount dir for debugging:', tmpHostDir);
    }
  } catch (e) {
    log('[worker] cleanup error:', e.message || e);
  }
  await updateScanTask(scanTaskId, { status, finished_at: new Date().toISOString() });

  try {
    await logAudit(requestedBy || null, status === 'completed' ? 'finish_scan_task' : 'finish_scan_task_with_issues', 'scan_task', scanTaskId || job.id, {
      worker_id: `${os.hostname()}:${process.pid}`,
      status,
      notes
    });
  } catch (e) {
    log('[worker] audit finish failed:', e.message || e);
  }

  if (!res.success && status === 'failed') {
    const errMsg = res.timedOut ? 'Scanner timed out' : `Scanner exited with code ${res.code}`;
    const err = new Error(errMsg); err.meta = res;
    try { await logAudit(requestedBy || null, 'error_scan_task', 'scan_task', scanTaskId || job.id, { worker_id: `${os.hostname()}:${process.pid}`, error: errMsg }); } catch (e) {}
    throw err;
  }

  log('[worker] Job', job.id, 'completed (status=' + status + ')');
  return { ok: true, result: scanOutput, meta: res.logs, scanTaskId };
}

async function linkMalwareToVulnerability(malwareResultIdOrSha, vulnId) {
  try {
    let malwareResultId = null;

    if (typeof malwareResultIdOrSha === 'string' && /^[0-9a-f]{64}$/i.test(malwareResultIdOrSha)) {
      const r = await pool.query(`SELECT id FROM malware_results WHERE sha256 = $1 LIMIT 1`, [malwareResultIdOrSha]);
      malwareResultId = r.rows[0] ? r.rows[0].id : null;
    } else {
      malwareResultId = malwareResultIdOrSha; 
    }

    if (!malwareResultId) {
      return;
    }

    await pool.query(
      `UPDATE vulnerabilities SET malware_result_id = $1, updated_at = NOW() WHERE id = $2`,
      [malwareResultId, vulnId]
    );
    log('[worker] Linked malware_result', malwareResultId, 'to vulnerability', vulnId);
  } catch (e) {
    logger.error('[worker] Failed to link malware result to vulnerability', e?.message || e);
  }
}
async function handleDownloadedFile(url, scanTaskId /* uuid */, vulnId /* maybe null */) {
  let sha256, tmpFilePath, tmpDir, totalBytes, contentType;
  try {
    const result = await downloadAndHash(url);
    sha256 = result.sha256;
    tmpFilePath = result.tmpFilePath;
    tmpDir = result.tmpDir;
    totalBytes = result.totalBytes;
    contentType = result.contentType;
  } catch (err) {
    logger.error('[scanWorker] downloadAndHash failed for', url, err?.message || err);
    throw err;
  }

  try {
    const cached = await getCachedResult(sha256);
    if (cached) {
      logger.info(`[scanWorker] VT cache hit for ${sha256} — skipping queue`);
      if (vulnId && cached.id) {
        await linkMalwareToVulnerability(cached.id, vulnId);
      }
    } else {
      try {
        await enqueueVTJob({
          sha256,
          scan_task_id: scanTaskId || null,
          related_vuln_id: vulnId || null,
          file_path: tmpFilePath || null
        });
        logger.info(`[scanWorker] enqueued VT job for ${sha256}`);
      } catch (e) {
        logger.warn('[scanWorker] enqueueVTJob failed or duplicate:', e?.message || e);
      }
    }
  } finally {
    try {
      await cleanupFile(tmpFilePath, tmpDir);
    } catch (e) {
      logger.warn('[scanWorker] cleanupFile failed:', e?.message || e);
    }
  }

  return { sha256, totalBytes, contentType };
}

let backgroundWorker = null;
let backgroundScheduler = scheduler || null;


async function startWorker(opts = {}) {
  if (backgroundWorker) return backgroundWorker;
  const concurrency = Number(process.env.WORKER_CONCURRENCY || opts.concurrency || 2);
  backgroundWorker = new Worker(QUEUE_NAME, processor, { connection, concurrency });

  backgroundWorker.on('completed', (job) => log('[worker] Completed job', job.id));
  backgroundWorker.on('failed', (job, err) => log('[worker] Failed job', job.id, err?.message || err));
  backgroundWorker.on('error', (err) => log('[worker] worker error', err?.message || err));

  if (!backgroundScheduler && QueueScheduler) {
    try {
      backgroundScheduler = new QueueScheduler(QUEUE_NAME, { connection });
      log('[worker] QueueScheduler created on start for', QUEUE_NAME);
    } catch (e) {
      log('[worker] QueueScheduler creation on start failed', e.message || e);
    }
  }

  return backgroundWorker;
}

async function stopWorker() {
  try {
    if (backgroundWorker) {
      await backgroundWorker.close();
      log('[worker] background worker closed');
      backgroundWorker = null;
    }
  } catch (e) {
    logger.warn('[worker] error closing backgroundWorker', e?.message || e);
  }

  try {
    if (backgroundScheduler) {
      if (typeof backgroundScheduler.close === 'function') {
        await backgroundScheduler.close();
        log('[worker] background scheduler closed');
      }
      backgroundScheduler = null;
    }
  } catch (e) {
    logger.warn('[worker] error closing backgroundScheduler', e?.message || e);
  }
}

if (require.main === module) {
  (async () => {
    try {
      await startWorker();
      log('[worker] started (pid=' + process.pid + ')');
    } catch (e) {
      logger.error('[worker] start failed', e?.message || e);
      process.exit(1);
    }
  })();
}

module.exports = {
  handleDownloadedFile,
  startWorker,
  stopWorker
};
