// backend/workers/virusTotalWorker.js
const axios = require('axios');
const logger = (() => {
  try { return require('../services/logger'); } catch (e) { return console; }
})();
const malwareService = (() => {
  try { return require('../services/malwareService'); } catch (e) { return null; }
})();

const VT_API_KEY = process.env.VIRUSTOTAL_API_KEY || process.env.VT_API_KEY;

async function vtGetFileReport(sha256) {
  if (!VT_API_KEY) throw new Error('VIRUSTOTAL_API_KEY not set');
  const url = `https://www.virustotal.com/api/v3/files/${sha256}`;
  const res = await axios.get(url, { headers: { 'x-apikey': VT_API_KEY }, timeout: 10000 });
  return res.data;
}

function extractPositives(report) {
  const attrs = (report && report.data && report.data.attributes) || (report && report.attributes) || {};
  const stats = attrs.last_analysis_stats || attrs.last_analysis || {};

  const m = stats.malicious;
  const s = stats.suspicious;
  if (typeof m !== 'undefined' || typeof s !== 'undefined') {
    return (Number(m) || 0) + (Number(s) || 0);
  }

  const candidates = ['malicious', 'malicious_count', 'positives', 'positives_count', 'suspicious'];
  for (const key of candidates) {
    if (typeof stats[key] !== 'undefined') return Number(stats[key]) || 0;
  }

  try {
    return Object.values(stats).reduce((acc, v) => acc + (Number(v) || 0), 0);
  } catch (e) {
    return 0;
  }
}

async function processJob(job = {}) {
  const resShape = { processed: false, positives: 0, notFound: false, fromCache: false, error: null };
  try {
    if (!job || !job.sha256) {
      resShape.error = 'missing_sha256';
      return resShape;
    }
    const sha = job.sha256;

    if (malwareService && typeof malwareService.getCachedResult === 'function') {
      const cached = await malwareService.getCachedResult(sha);
      if (cached) {
        resShape.fromCache = true;
        resShape.processed = true;
        resShape.positives = Number(cached.positives || 0);
        if (typeof malwareService.removeQueueJob === 'function' && job.id) {
          await malwareService.removeQueueJob(job.id);
        }
        return resShape;
      }
    }

    let report;
    try {
      report = await vtGetFileReport(sha);
    } catch (err) {
      if (err && err.response && err.response.status === 404) {
        resShape.notFound = true;
        resShape.processed = true;
        if (malwareService && typeof malwareService.upsertMalwareResult === 'function') {
          await malwareService.upsertMalwareResult({ sha256: sha, positives: 0, vt_not_found: true });
        }
        if (typeof malwareService.removeQueueJob === 'function' && job.id) {
          await malwareService.removeQueueJob(job.id);
        }
        return resShape;
      }
      throw err;
    }

    const positives = extractPositives(report);

    if (malwareService && typeof malwareService.upsertMalwareResult === 'function') {
      await malwareService.upsertMalwareResult({ sha256: sha, positives, raw: report });
    }
    if (typeof malwareService.removeQueueJob === 'function' && job.id) {
      await malwareService.removeQueueJob(job.id);
    }

    resShape.processed = true;
    resShape.positives = Number(positives || 0);
    return resShape;
  } catch (err) {
    try { if (logger && typeof logger.error === 'function') logger.error('vt.processJob_error', { err: err.stack || String(err) }); } catch (e) {}
    resShape.error = err && err.message ? err.message : String(err);
    return resShape;
  }
}

module.exports = { processJob, vtGetFileReport, extractPositives };
