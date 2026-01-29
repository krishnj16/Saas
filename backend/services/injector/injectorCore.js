const logger = require('../services/logger');
/**
 * Core detection logic: baselineRequest, checkXSS, checkBlindSQLi, checkCommandInjection, checkCSRF.
 * Uses axios for HTTP calls. All time-based destructive tests are guarded by SAFE_MODE and/or consent flags.
 */

const axios = require('axios');
const cheerio = require('cheerio');
let config;
try {
  config = require('../../config/injector.config');
} catch (e) {
  // fallback defaults if config file not available (useful for tests)
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

const DEFAULT_TIMEOUT_MS = 15000;

function buildRequestConfig(row, injectionValue) {
  const method = (row.method || 'GET').toUpperCase();
  const headers = { 'User-Agent': config.USER_AGENT || 'SaAs-Scanner/1.0' };
  const axiosConf = { method, url: row.url, headers, timeout: DEFAULT_TIMEOUT_MS, validateStatus: () => true };

  if (method === 'GET') {
    const u = new URL(row.url);
    if (!row.param_name) return axiosConf;
    u.searchParams.set(row.param_name, injectionValue);
    axiosConf.url = u.href;
  } else {
    // POST default: application/x-www-form-urlencoded
    axiosConf.headers['content-type'] = 'application/x-www-form-urlencoded';
    const bodyVal = (row.param_name) ? `${encodeURIComponent(row.param_name)}=${encodeURIComponent(injectionValue)}` : injectionValue;
    axiosConf.data = bodyVal;
  }
  return axiosConf;
}

async function baselineRequest(row) {
  const benign = 'safe_benign_123';
  const conf = buildRequestConfig(row, benign);
  const start = Date.now();
  const res = await axios(conf).catch(e => e.response || { data: '', status: 0 });
  return { ms: Date.now() - start, status: res.status, body: (typeof res.data === 'string') ? res.data : JSON.stringify(res.data) };
}

async function checkXSS(row, baseline) {
  try {
    const marker = `__XSS_${Math.random().toString(36).slice(2,8)}__`;
    const payload = `<script>document.write("${marker}")</script>`;
    const conf = buildRequestConfig(row, payload);
    const start = Date.now();
    const res = await axios(conf).catch(e => e.response || { data: '' });
    const timing = Date.now() - start;
    const body = (typeof res.data === 'string') ? res.data : JSON.stringify(res.data);
    // direct marker appearence
    if (body.includes(marker) || body.includes(`<script>document.write("${marker}")</script>`)) {
      return { found: true, evidence: { request: { method: conf.method, url: conf.url, body_snippet: conf.data ? String(conf.data).slice(0,1000) : '' }, response_snippet: body.slice(0,2000), timing_ms: timing, baseline_ms: baseline.ms, marker, payload } };
    }
    return { found: false };
  } catch (err) {
    logger.error('checkXSS error', err);
    return { found: false, error: String(err) };
  }
}

async function checkBlindSQLi(row, baseline) {
  if (config.SAFE_MODE) return { found: false, notes: 'SAFE_MODE' };
  const payloads = [
    `' OR SLEEP(${Math.ceil(config.SQLI_TIME_SLEEP_MS/1000)})-- `,
    `'; SELECT pg_sleep(${Math.ceil(config.SQLI_TIME_SLEEP_MS/1000)})-- `
  ];
  for (let i = 0; i < Math.min(payloads.length, config.MAX_PROBES_PER_INPUT); i++) {
    const payload = payloads[i];
    const conf = buildRequestConfig(row, payload);
    const start = Date.now();
    const res = await axios(conf).catch(e => e.response || { data: '' });
    const timing = Date.now() - start;
    if (timing - baseline.ms > config.TIMING_THRESHOLD_MS) {
      const body = (typeof res.data === 'string') ? res.data : JSON.stringify(res.data);
      return { found: true, evidence: { request: { method: conf.method, url: conf.url, body_snippet: conf.data ? String(conf.data).slice(0,200) : '' }, response_snippet: body.slice(0,2000), timing_ms: timing, baseline_ms: baseline.ms, payload } };
    }
  }
  return { found: false };
}

async function checkCommandInjection(row, baseline) {
  if (config.SAFE_MODE || !config.CONSENT_FOR_COMMAND_INJECTION) return { found: false, notes: 'Not allowed' };
  const payload = `; sleep ${Math.ceil(config.SQLI_TIME_SLEEP_MS/1000)};`;
  const conf = buildRequestConfig(row, payload);
  const start = Date.now();
  const res = await axios(conf).catch(e => e.response || { data: '' });
  const timing = Date.now() - start;
  if (timing - baseline.ms > config.TIMING_THRESHOLD_MS) {
    const body = (typeof res.data === 'string') ? res.data : JSON.stringify(res.data);
    return { found: true, evidence: { request: { method: conf.method, url: conf.url, body_snippet: conf.data ? String(conf.data).slice(0,200) : '' }, response_snippet: body.slice(0,2000), timing_ms: timing, baseline_ms: baseline.ms, payload } };
  }
  return { found: false };
}

async function checkCSRF(row) {
  // If HTML snippet present, parse forms; otherwise use heuristic on observed headers or method.
  try {
    if (!row.method || (row.method || 'GET').toUpperCase() !== 'POST') return { found: false };
    const html = row.html_snippet || '';
    if (!html) {
      const headers = row.observed_request_headers || [];
      const hasTokenHeader = headers.some(h => /csrf|x-csrf|x-xsrf/i.test(String(h)));
      if (!hasTokenHeader) return { found: true, evidence: { notes: 'POST endpoint discovered without observed CSRF header' } };
      return { found: false };
    }
    const $ = cheerio.load(html);
    let found = false;
    $('form').each((i, f) => {
      $(f).find('input[type=hidden]').each((j, inp) => {
        const name = $(inp).attr('name') || '';
        if (/csrf|token|_csrf|csrfmiddlewaretoken/i.test(name)) found = true;
      });
    });
    if (!found) return { found: true, evidence: { notes: 'POST form missing hidden CSRF token field in discovered HTML' } };
    return { found: false };
  } catch (err) {
    logger.error('checkCSRF error', err);
    return { found: false, error: String(err) };
  }
}

module.exports = { baselineRequest, checkXSS, checkBlindSQLi, checkCommandInjection, checkCSRF };
