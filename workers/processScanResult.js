

const db = require('../utils/db');
const { parseWpscan } = require('../parsers/parse-wpscan');
const { parseWapiti } = require('../parsers/parse-wapiti');


async function callQueryFunction(queryFn, q, values = []) {
  if (!queryFn) throw new Error('No query function provided');

  if (db && db.pool && typeof db.pool.query === 'function' && db.pool.query === queryFn) {
    return db.pool.query(q, values);
  }

  if (db && typeof db.query === 'function' && db.query === queryFn) {
    return db.query(q, values);
  }

  if (db && db.pool && typeof db.pool.query === 'function') {
    return db.pool.query(q, values);
  }

  return queryFn(q, values);
}

async function getVulnColumnsMeta(clientOrQueryFn) {
  const q = `
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vulnerabilities'
    ORDER BY ordinal_position;
  `;

  let res;
  if (clientOrQueryFn && typeof clientOrQueryFn.query === 'function') {
    res = await clientOrQueryFn.query(q);
  } else if (typeof clientOrQueryFn === 'function') {
    res = await clientOrQueryFn(q);
  } else {
    throw new Error('Invalid clientOrQueryFn in getVulnColumnsMeta');
  }

  const rows = (res && res.rows) ? res.rows : res;
  if (!Array.isArray(rows)) return [];
  return rows.map(r => ({ column_name: r.column_name, data_type: r.data_type }));
}

 
function normalizeValueForMeta(meta, field, value) {
  const dt = (meta && meta.data_type) ? meta.data_type.toLowerCase() : '';

  if (!dt || (dt !== 'json' && dt !== 'jsonb')) {
    if (value === undefined) return null;
    return value;
  }
  if (field === 'raw_json') {
    if (value && typeof value === 'object') return value;
    return { raw: value === undefined ? null : String(value) };
  }

  if (value && typeof value === 'object') return value;
  return { value: value === undefined ? null : String(value) };
}

function buildInsertForVuln(allowedMeta, scanTaskId, vuln) {
  const fieldMap = {
    scan_task_id: scanTaskId,
    scanner: vuln.scanner,
    type: vuln.type,
    severity: vuln.severity,
    title: vuln.title,
    description: vuln.description,
    path: vuln.path,
    parameter: vuln.parameter,
    evidence: vuln.evidence,
    raw_json: vuln.raw || {},
  };

  const allowedCols = allowedMeta.map(m => m.column_name);
  const cols = [];
  const vals = [];
  const placeholders = [];
  let idx = 1;

  for (const [field, value] of Object.entries(fieldMap)) {
    if (!allowedCols.includes(field)) continue;
    const meta = allowedMeta.find(m => m.column_name === field);
    const finalValue = normalizeValueForMeta(meta, field, value);
    cols.push(field);
    vals.push(finalValue);
    placeholders.push(`$${idx}`);
    idx += 1;
  }

  if (cols.length === 0) throw new Error('No matching columns found to insert vulnerability');

  const sql = `INSERT INTO vulnerabilities (${cols.join(',')}) VALUES (${placeholders.join(',')}) RETURNING *`;
  return { sql, vals };
}


async function insertVulnsWithClient(client, scanTaskId, vulns) {
  const metaRes = await client.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='vulnerabilities'
  `);
  const allowedMeta = (metaRes && metaRes.rows) ? metaRes.rows.map(r => ({ column_name: r.column_name, data_type: r.data_type })) : [];
  if (!allowedMeta.length) throw new Error('Could not detect vulnerabilities columns');

  const inserted = [];
  for (const v of vulns) {
    const { sql, vals } = buildInsertForVuln(allowedMeta, scanTaskId, v);
    const res = await client.query(sql, vals);
    inserted.push((res && res.rows && res.rows[0]) ? res.rows[0] : (Array.isArray(res) ? res[0] : res));
  }
  return inserted;
}

async function insertVulnsWithQueryFn(queryFn, scanTaskId, vulns) {
  const colRes = await callQueryFunction(queryFn, `
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='vulnerabilities'
  `, []);
  const allowedMeta = (colRes && colRes.rows) ? colRes.rows.map(r => ({ column_name: r.column_name, data_type: r.data_type })) : [];
  if (!allowedMeta.length) throw new Error('Could not detect vulnerabilities columns (queryFn)');

  const inserted = [];
  for (const v of vulns) {
    const { sql, vals } = buildInsertForVuln(allowedMeta, scanTaskId, v);
    const res = await callQueryFunction(queryFn, sql, vals);
    inserted.push((res && res.rows && res.rows[0]) ? res.rows[0] : (Array.isArray(res) ? res[0] : res));
  }
  return inserted;
}


async function processScanResult({ scanTaskId, scannerName, rawJson }) {
  let vulns = [];
  if (scannerName === 'wpscan') vulns = parseWpscan(rawJson);
  else if (scannerName === 'wapiti') vulns = parseWapiti(rawJson);
  else {
    const fallback = rawJson && rawJson.vulnerabilities;
    if (Array.isArray(fallback)) {
      vulns = fallback.map(v => ({
        scanner: scannerName,
        type: v.type || 'other',
        severity: v.severity || 'low',
        title: v.title || v.name || 'vuln',
        description: v.description || '',
        path: v.path || null,
        parameter: v.parameter || null,
        evidence: v.evidence || '',
        raw: v,
      }));
    } else {
      vulns = [];
    }
  }

  if (!Array.isArray(vulns) || vulns.length === 0) return [];

  if (db && db.pool && typeof db.pool.connect === 'function') {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const inserted = await insertVulnsWithClient(client, scanTaskId, vulns);
      await client.query('COMMIT');
      return inserted;
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }

  if (db && typeof db.getClient === 'function') {
    const client = await db.getClient();
    try {
      if (client && typeof client.query === 'function') {
        await client.query('BEGIN');
        const inserted = await insertVulnsWithClient(client, scanTaskId, vulns);
        await client.query('COMMIT');
        return inserted;
      }
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      throw err;
    } finally {
      if (client && typeof client.release === 'function') client.release();
    }
  }

  if (db && db.client && typeof db.client.query === 'function') {
    const client = db.client;
    try {
      await client.query('BEGIN');
      const inserted = await insertVulnsWithClient(client, scanTaskId, vulns);
      await client.query('COMMIT');
      return inserted;
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    }
  }

  if (db && typeof db.query === 'function') {
    try {
      await callQueryFunction(db.query, 'BEGIN', []);
      const inserted = await insertVulnsWithQueryFn(db.query, scanTaskId, vulns);
      await callQueryFunction(db.query, 'COMMIT', []);
      return inserted;
    } catch (err) {
      try { await callQueryFunction(db.query, 'ROLLBACK', []); } catch (_) {}
      throw err;
    }
  }

  throw new Error('Unsupported DB export in backend/utils/db.js. Expected one of: { pool }, getClient(), { client }, or query().');
}

module.exports = { processScanResult };
