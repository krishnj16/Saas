require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');
const pool = require('../utils/db');
const {
  fetchNextQueueJob,
  markQueueJobAttempt,
  removeQueueJob,
  getCachedResult,
  upsertMalwareResult
} = require('../services/malwareService');

const RATE_PER_MIN = parseInt(process.env.VIRUSTOTAL_RATE_PER_MIN || '4', 10);
const TTL_DAYS = parseInt(process.env.VIRUSTOTAL_CACHE_TTL_DAYS || '7', 10);
const VT_API_KEY = process.env.VIRUSTOTAL_API_KEY || '';

const intervalMs = Math.ceil(60000 / Math.max(1, RATE_PER_MIN));
let lastRequestTime = 0;

async function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

async function vtGetFileReport(sha256) {
  if (!VT_API_KEY) throw new Error('VIRUSTOTAL_API_KEY not set');
  try {
    const res = await axios.get(`https://www.virustotal.com/api/v3/files/${sha256}`, {
      headers: { 'x-apikey': VT_API_KEY },
      timeout: 20000
    });
    return res.data;
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return { not_found: true, status: 404 };
    }
    throw err;
  }
}


async function processJob(job) {
  if (!job || !job.sha256) throw new Error('invalid job');

  await markQueueJobAttempt(job.id);

  const cached = await getCachedResult(job.sha256);
  if (cached) {
    if (job.related_vuln_id && cached.id) {
      try {
        await pool.query('UPDATE vulnerabilities SET malware_result_id = $1, updated_at = NOW() WHERE id = $2', [cached.id, job.related_vuln_id]);
      } catch (e) {
      }
    }
    await removeQueueJob(job.id);
    return { fromCache: true, cached };
  }

  const shouldSkip = (process.env.SKIP_VT === 'true' || process.env.SKIP_VT === '1')
    || (typeof process.env.VIRUSTOTAL_API_KEY === 'string' && process.env.VIRUSTOTAL_API_KEY.startsWith('FAKE'));

  if (shouldSkip) {
    const mockedResponse = {
      mocked: true,
      note: 'skipped VT in dev mode',
      sha256: job.sha256
    };

    const saved = await upsertMalwareResult({
      sha256: job.sha256,
      vt_response: mockedResponse,
      positives: 0,
      vt_last_seen: new Date().toISOString(),
      ttlDays: 7
    });

    if (job.related_vuln_id && saved && saved.id) {
      try {
        await pool.query('UPDATE vulnerabilities SET malware_result_id = $1, updated_at = NOW() WHERE id = $2', [saved.id, job.related_vuln_id]);
      } catch (e) {
      }
    }

    await removeQueueJob(job.id);
    return { skipped: true, saved };
  }

  const now = Date.now();
  const since = now - lastRequestTime;
  if (since < intervalMs) await sleep(intervalMs - since);

  let vtData;
  try {
    vtData = await vtGetFileReport(job.sha256);
    lastRequestTime = Date.now();
  } catch (err) {
    console.error('[VT worker] job failed', err?.message || err);
    throw err;
  }

  if (vtData && vtData.not_found) {
    await upsertMalwareResult({
      sha256: job.sha256,
      vt_response: vtData,
      positives: 0,
      vt_last_seen: null,
      ttlDays: Math.min(TTL_DAYS, 1)
    });
    await removeQueueJob(job.id);
    return { notFound: true };
  }

  let positives = null;
  try {
    if (vtData && vtData.data && vtData.data.attributes && vtData.data.attributes.last_analysis_stats) {
      const stats = vtData.data.attributes.last_analysis_stats;
      positives = (stats.malicious || 0) + (stats.suspicious || 0);
    }
  } catch (e) { /* ignore */ }

  const saved = await upsertMalwareResult({
    sha256: job.sha256,
    vt_response: vtData,
    positives,
    vt_last_seen: new Date().toISOString(),
    ttlDays: TTL_DAYS
  });

  if (job.related_vuln_id && positives && positives > 0) {
    try {
      await pool.query('UPDATE vulnerabilities SET malware_result_id = $1, updated_at = NOW() WHERE id = $2', [saved.id, job.related_vuln_id]);
    } catch (e) {
    }
  }

  await removeQueueJob(job.id);
  return { processed: true, positives, saved };
}

if (require.main === module) {
  (async () => {
    if (!VT_API_KEY) {
      console.error('VIRUSTOTAL_API_KEY not set; exiting');
      process.exit(1);
    }
    console.log('[VT worker] starting loop with interval ms', intervalMs);
    while (true) {
      try {
        const job = await fetchNextQueueJob();
        if (!job) {
          await sleep(3000);
          continue;
        }
        try {
          await processJob(job);
        } catch (err) {
          console.error('[VT worker] job failed', err?.message || err);
        }
      } catch (e) {
        console.error('[VT worker] main loop error', e?.message || e);
        await sleep(5000);
      }
    }
  })();
}

module.exports = { vtGetFileReport, processJob, intervalMs };
