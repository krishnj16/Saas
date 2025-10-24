

const puppeteer = require('puppeteer');
const { URL } = require('url');
const pool = require('../utils/db'); 
const NAV_TIMEOUT = parseInt(process.env.NAV_TIMEOUT || '30000', 10);
const DEFAULT_CRAWL_DEPTH = parseInt(process.env.CRAWL_DEPTH || '3', 10);
const BATCH_FLUSH_LIMIT = parseInt(process.env.DISCOVERY_BATCH_LIMIT || '200', 10);

function sameDomain(seed, target) {
  try {
    const s = new URL(seed);
    const t = new URL(target, seed);
    return s.hostname === t.hostname && s.protocol === t.protocol;
  } catch (e) {
    return false;
  }
}
function normalizeUrl(base, link) {
  try {
    return new URL(link, base).toString().split('#')[0];
  } catch (e) {
    return null;
  }
}
function sampleValueForType(type, name) {
  name = name || '';
  type = (type || 'text').toLowerCase();
  if (type === 'email' || /email/i.test(name)) return 'test@example.com';
  if (type === 'tel' || /phone|tel/i.test(name)) return '+911234567890';
  if (type === 'number' || /age|count|num|quantity/i.test(name)) return '123';
  if (type === 'password' || /pass|pwd/i.test(name)) return 'P@ssw0rd!';
  if (type === 'hidden') return 'hidden_sample';
  if (type === 'checkbox' || type === 'radio') return 'on';
  if (type === 'textarea') return 'sample text';
  return 'sample';
}
function detectCsrf(fieldName, fieldValue, meta) {
  if (!fieldName) return false;
  const n = fieldName.toLowerCase();
  if (n.includes('csrf') || n.includes('token') || n.includes('nonce') || n.includes('_wpnonce')) return true;
  if (meta && meta.type === 'hidden' && typeof fieldValue === 'string' && fieldValue.length > 16) return true;
  return false;
}

async function saveDiscovery(rows) {
  if (!rows || rows.length === 0) return;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const cols = ['scan_task_id','url','action_url','method','param_name','input_type','sample_value','is_hidden','is_csrf','extra'];
    const values = [];
    const placeholders = [];

    rows.forEach((r, i) => {
      const baseIndex = i * cols.length;
      const ph = cols.map((_, j) => `$${baseIndex + j + 1}`);
      placeholders.push(`(${ph.join(',')})`);
      values.push(
        r.scan_task_id || null,
        r.url || null,
        r.action_url || null,
        r.method || null,
        r.param_name || null,
        r.input_type || null,
        r.sample_value || null,
        !!r.is_hidden,
        !!r.is_csrf,
        JSON.stringify(r.extra || {})
      );
    });

    const insertSql = `
      INSERT INTO scan_discovery (${cols.join(',')})
      VALUES ${placeholders.join(',')}
      ON CONFLICT DO NOTHING
    `;

    await client.query(insertSql, values);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('saveDiscovery batch insert error', e);
    throw e;
  } finally {
    client.release();
  }
}


async function discoverForScanTask({ scanTaskId = null, startUrl, maxDepth = DEFAULT_CRAWL_DEPTH, headless = true, puppeteerArgs = [] }) {
  if (!startUrl) throw new Error('startUrl required');
  const startingPoints = [startUrl];
  try {
    try { startingPoints.push(new URL('/wp-json', startUrl).toString()); } catch(e) {}

    const browser = await puppeteer.launch({ args: ['--no-sandbox', ...puppeteerArgs], headless });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(NAV_TIMEOUT);

    const restEndpoints = new Set();
    page.on('request', req => {
      const url = req.url();
      const resourceType = req.resourceType();
      if ((resourceType === 'xhr' || resourceType === 'fetch') && sameDomain(startUrl, url)) {
        restEndpoints.add(url.split('?')[0]);
      }
    });

    const visited = new Set();
    const queue = startingPoints.map(u => ({ url: u, depth: 0 }));
    const discoveredRows = [];

    while (queue.length) {
      const { url, depth } = queue.shift();
      if (!url) continue;
      if (visited.has(url)) continue;
      if (depth > maxDepth) continue;
      visited.add(url);

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
      } catch (e) {
        console.warn('Navigation failed for', url, e.message?.slice(0,120));
        continue;
      }

      let links = [];
      try {
        links = await page.$$eval('a[href]', anchors => anchors.map(a => a.getAttribute('href')).filter(Boolean));
      } catch (e) { /* ignore */ }

      for (const rawLink of links) {
        const normalized = normalizeUrl(url, rawLink);
        if (!normalized) continue;
        if (!sameDomain(startUrl, normalized)) continue;
        if (!visited.has(normalized) && depth + 1 <= maxDepth) {
          queue.push({ url: normalized, depth: depth + 1 });
        }
      }

      let forms = [];
      try {
        forms = await page.$$eval('form', forms => {
          return forms.map((f, fi) => {
            const action = f.getAttribute('action') || location.href;
            const method = (f.getAttribute('method') || 'GET').toUpperCase();
            const inputs = Array.from(f.querySelectorAll('input,textarea,select')).map((i, idx) => {
              return {
                name: i.getAttribute('name') || null,
                type: (i.getAttribute('type') || i.tagName.toLowerCase()),
                value: i.getAttribute('value') || (i.tagName.toLowerCase() === 'textarea' ? i.innerText : '') || null,
                placeholder: i.getAttribute('placeholder') || null,
                index: idx
              };
            });
            return { action, method, inputs, form_index: fi };
          });
        });
      } catch (e) {
        console.warn('form extraction failed for', url, e.message?.slice(0,120));
      }

      for (const f of forms) {
        for (const input of f.inputs) {
          const isHidden = (input.type || '').toLowerCase() === 'hidden';
          const isCsrf = detectCsrf(input.name, input.value, { type: input.type });
          const sampleValue = (isHidden && input.value) ? input.value : (isCsrf ? (input.value || 'csrf_sample') : sampleValueForType(input.type, input.name));
          discoveredRows.push({
            scan_task_id: scanTaskId,
            url,
            action_url: normalizeUrl(url, f.action) || url,
            method: f.method,
            param_name: input.name,
            input_type: input.type,
            sample_value: sampleValue,
            is_hidden: !!isHidden,
            is_csrf: !!isCsrf,
            extra: { placeholder: input.placeholder, form_index: f.form_index, field_index: input.index, detected_by: 'form' }
          });
        }
      }

      try {
        const orphanInputs = await page.$$eval('input[name]:not(form input), textarea[name]:not(form textarea), select[name]:not(form select)', els =>
          els.map(i => ({ name: i.getAttribute('name'), type: i.getAttribute('type') || i.tagName.toLowerCase(), value: i.getAttribute('value') || null }))
        );
        for (const input of orphanInputs) {
          const isHidden = (input.type || '').toLowerCase() === 'hidden';
          const isCsrf = detectCsrf(input.name, input.value, { type: input.type });
          discoveredRows.push({
            scan_task_id: scanTaskId,
            url,
            action_url: url,
            method: 'GET',
            param_name: input.name,
            input_type: input.type,
            sample_value: isHidden ? input.value : sampleValueForType(input.type, input.name),
            is_hidden: !!isHidden,
            is_csrf: !!isCsrf,
            extra: { detected_by: 'orphan' }
          });
        }
      } catch (e) { /* ignore */ }

      for (const re of Array.from(restEndpoints)) {
        discoveredRows.push({
          scan_task_id: scanTaskId,
          url,
          action_url: re,
          method: null,
          param_name: null,
          input_type: 'rest_endpoint',
          sample_value: null,
          is_hidden: false,
          is_csrf: false,
          extra: { detected_by: 'xhr', rest_endpoint: true }
        });
      }

      if (discoveredRows.length >= BATCH_FLUSH_LIMIT) {
        const slice = discoveredRows.splice(0, discoveredRows.length);
        await saveDiscovery(slice);
      }
    }

    if (discoveredRows.length) await saveDiscovery(discoveredRows);

    try { await page.close(); } catch (e) {}
    try { await browser.close(); } catch (e) {}
  } catch (err) {
    console.error('discoverForScanTask error', err);
    throw err;
  }
}

module.exports = { discoverForScanTask };
