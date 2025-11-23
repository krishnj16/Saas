const pLimit = require('p-limit');
const discoveryFetcher = require('./discoveryFetcher');
const injectorCore = require('./injectorCore');
const robotsCache = require('../../utils/robotsCache');
const rateLimiter = require('../../utils/rateLimiter');
const sanitizer = require('../../utils/sanitizer');
const { pool } = require('../../utils/db');
const logger = require('../logger');



let config;
try {
  config = require('../../config/injector.config');
} catch (e1) {
  try {
    config = require('../../../config/injector.config');
  } catch (e2) {
    // fallback defaults
    config = {
      SAFE_MODE: process.env.SAFE_MODE === 'true',
      DRY_RUN: process.env.DRY_RUN === 'true',
      CONSENT_FOR_COMMAND_INJECTION: process.env.CONSENT_FOR_COMMAND_INJECTION === 'true',
      GLOBAL_RATE_LIMIT_PER_SEC: Number(process.env.GLOBAL_RATE_LIMIT_PER_SEC || 1),
      GLOBAL_CONCURRENCY: Number(process.env.GLOBAL_CONCURRENCY || 4),
      SQLI_TIME_SLEEP_MS: Number(process.env.SQLI_TIME_SLEEP_MS || 2000),
      TIMING_THRESHOLD_MS: Number(process.env.TIMING_THRESHOLD_MS || 800),
      MAX_PROBES_PER_INPUT: Number(process.env.MAX_PROBES_PER_INPUT || 2),
      USER_AGENT: process.env.USER_AGENT || 'SaAs-Scanner/1.0'
    };
  }
}

const CONCURRENCY = Number(process.env.GLOBAL_CONCURRENCY || config.GLOBAL_CONCURRENCY || 4);
const limit = pLimit(CONCURRENCY);

async function saveVulnerability(siteId, discoveryId, type, severity, evidence, options = {}) {
  const sanitizedEvidence = sanitizer.sanitizeEvidence(evidence);
  if (options.dryRun || config.DRY_RUN || process.env.DRY_RUN === 'true') {
    logger.info('[DRY_RUN] Vulnerability (not saved):', { siteId, discoveryId, type, severity, evidence: sanitizedEvidence });
    return;
  }
  const q = `INSERT INTO vulnerabilities (site_id, discovery_id, type, severity, evidence) VALUES ($1,$2,$3,$4,$5) RETURNING id`;
  const vals = [siteId, discoveryId, type, severity, sanitizedEvidence];
  await pool.query(q, vals);
}

async function processRow(row, options = {}) {
  const origin = row.site_origin || new URL(row.url).origin;
  const robots = await robotsCache.getRobots(origin);
  if (robots && !robots.isAllowed(row.url, config.USER_AGENT)) {
    logger.info(`[injector] Skipping ${row.url} - disallowed by robots.txt`);
    return;
  }
  await rateLimiter.throttleForSite(origin);
  const baseline = await injectorCore.baselineRequest(row);
  const xss = await injectorCore.checkXSS(row, baseline);
  if (xss.found) await saveVulnerability(row.site_id, row.id, 'xss-reflective', 'medium', xss.evidence, options);

  const csrf = await injectorCore.checkCSRF(row);
  if (csrf.found) await saveVulnerability(row.site_id, row.id, 'csrf-missing-token', 'medium', csrf.evidence, options);

  if (!config.SAFE_MODE && process.env.SAFE_MODE !== 'true') {
    const sqli = await injectorCore.checkBlindSQLi(row, baseline);
    if (sqli.found) await saveVulnerability(row.site_id, row.id, 'sqli-blind', 'high', sqli.evidence, options);

    const cmd = await injectorCore.checkCommandInjection(row, baseline);
    if (cmd.found) await saveVulnerability(row.site_id, row.id, 'command-inject', 'critical', cmd.evidence, options);
  } else {
    logger.info('[injector] SAFE_MODE on — skipping time-based/destructive tests');
  }
  try {
    await discoveryFetcher.markScanned(row.id);
  } catch (e) {
    logger.warn('[injector] markScanned failed', e && e.message);
  }
}

async function runForSite(siteId, options = {}) {
  const rows = await discoveryFetcher.fetchForSite(siteId);
  const tasks = rows.map(r => limit(() => processRow(r, options)));
  await Promise.all(tasks);
}

async function runAllPending(options = {}) {
  const rows = await discoveryFetcher.fetchPending();
  const tasks = rows.map(r => limit(() => processRow(r, options)));
  await Promise.all(tasks);
}

module.exports = { runForSite, runAllPending };
