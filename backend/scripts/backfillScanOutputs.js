const { pool } = require('../db/pgPool');
const { parseWpscan } = require('../parsers/parseWpscan');
const { parseWapiti } = require('../parsers/parseWapiti');

async function persistVulnerability(client, scanTaskId, vuln) {
  const q = `INSERT INTO vulnerabilities
    (scan_task_id, scanner, type, severity, title, description, path, parameter, evidence, raw_json)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`;
  const values = [
    scanTaskId,
    vuln.scanner,
    vuln.type,
    vuln.severity,
    vuln.title,
    vuln.description,
    vuln.path,
    vuln.parameter,
    vuln.evidence,
    vuln.raw || {},
  ];
  const res = await client.query(q, values);
  return res.rows[0];
}

function parseByScanner(scannerName, rawJson) {
  if (scannerName === 'wpscan') return parseWpscan(rawJson);
  if (scannerName === 'wapiti') return parseWapiti(rawJson);
  const fallback = rawJson && rawJson.vulnerabilities;
  if (Array.isArray(fallback)) {
    return fallback.map(v => ({ scanner: scannerName, type: v.type||'other', severity: v.severity||'low', title: v.title||v.name||'vuln', description: v.description||'', path: v.path||null, parameter:v.parameter||null, evidence:v.evidence||'', raw:v }));
  }
  return [];
}

async function backfill(limit = 1000) {
  const client = await pool.connect();
  try {
    const rows = (await client.query('SELECT * FROM scan_outputs ORDER BY id ASC LIMIT $1', [limit])).rows;
    logger.info('Found', rows.length, 'scan_outputs to process');
    for (const r of rows) {
      const scanTaskId = r.scan_task_id;
      const scannerName = r.scanner_name;
      const rawJson = r.raw_json;
      const vulns = parseByScanner(scannerName, rawJson);
      if (!vulns.length) continue;
      await client.query('BEGIN');
      try {
        for (const v of vulns) {
          await persistVulnerability(client, scanTaskId, v);
        }
        await client.query('COMMIT');
        logger.info(`Backfilled scan_output id=${r.id} -> ${vulns.length} vulnerabilities`);
      } catch (err) {
        await client.query('ROLLBACK');
        logger.error('Failed to persist for scan_output id=', r.id, err);
      }
    }
  } finally {
    client.release();
  }
}

if (require.main === module) {
  const arg = process.argv[2];
  const limit = arg ? parseInt(arg, 10) : 1000;
  backfill(limit).then(()=>{ logger.info('done backfill'); process.exit(0); }).catch(err=>{ logger.error(err); process.exit(1); });
}

module.exports = { backfill };
