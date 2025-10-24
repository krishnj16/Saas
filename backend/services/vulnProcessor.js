const crypto = require('crypto');
const pool = require('../utils/db'); 


function getNormalizedSeverity(scanner, scannerSeverity) {
  const s = (scannerSeverity || '').toLowerCase();
  if (s.includes('crit')) return 'critical';
  if (s.includes('high')) return 'high';
  if (s.includes('medium') || s.includes('med')) return 'medium';
  if (s.includes('low') || s.includes('info') || s.includes('inform')) return 'low';
  return 'medium';
}


function computeFingerprint(raw) {
  if (raw && raw.scanner_fingerprint) return raw.scanner_fingerprint;
  const str = `${raw && raw.scanner ? raw.scanner : ''}|${raw && raw.type ? raw.type : ''}|${raw && raw.path ? raw.path : ''}|${raw && raw.parameter ? raw.parameter : ''}|${JSON.stringify(raw && raw.raw ? raw.raw : {})}`;
  return crypto.createHash('sha256').update(str).digest('hex');
}

function applyRules(finding, context = {}) {
  const tags = new Set(Array.isArray(finding.rule_tags) ? finding.rule_tags : []);
  let sev = finding.normalized_severity || getNormalizedSeverity(finding.scanner, finding.scanner_severity || '');

  if ((finding.exploitability_score || 0) >= 7) {
    const bump = { low: 'medium', medium: 'high', high: 'critical', critical: 'critical' };
    sev = bump[sev] || sev;
    tags.add('exploitability_high');
  }

  if (context.occurrencesAcrossHosts && context.occurrencesAcrossHosts >= (context.threshold || 5)) {
    if ((context.exploitabilityAggregate || 0) === 0) {
      tags.add('many_hosts_non_exploitable');
      const order = { low: 0, medium: 1, high: 2, critical: 3 };
      if (order[sev] > order['medium']) sev = 'medium';
    }
  }

  if (finding.vt_malicious) {
    tags.add('vt_malicious');
    sev = 'critical';
  }

  return { normalized_severity: sev, rule_tags: Array.from(tags) };
}

async function processScan(scanId, websiteId, findings) {
  if (!Array.isArray(findings)) findings = [];

  const resultSummary = { inserted: 0, updated: 0, details: [] };
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const colsRes = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = current_schema() AND table_name = 'vulnerability_findings'`
    );
    const existingCols = new Set(colsRes.rows.map(r => r.column_name));
    const has = (name) => existingCols.has(name);

    for (const rawFinding of findings) {
      const fingerprint = computeFingerprint(rawFinding);
      const normalized = getNormalizedSeverity(rawFinding.scanner, rawFinding.scanner_severity || '');
      const ruleApplied = applyRules({ ...rawFinding, normalized_severity: normalized }, {});

      
      const scanner = rawFinding.scanner || null;
      const path = rawFinding.path || null;
      const parameter = typeof rawFinding.parameter === 'undefined' ? null : rawFinding.parameter;
      const type = rawFinding.type || null;

      let existingRes;
      if (has('fingerprint') || has('scanner_fingerprint')) {
        const fpCol = has('fingerprint') ? 'fingerprint' : 'scanner_fingerprint';
        existingRes = await client.query(
          `SELECT id, ${has('status') ? 'status' : 'NULL as status'} FROM vulnerability_findings WHERE website_id = $1 AND ${fpCol} = $2 LIMIT 1`,
          [websiteId, fingerprint]
        );
      } else {
        existingRes = await client.query(
          `SELECT id, ${has('status') ? 'status' : 'NULL as status'} FROM vulnerability_findings
           WHERE website_id = $1
             AND COALESCE(path,'') = COALESCE($2,'')
             AND COALESCE(parameter::text,'') = COALESCE($3::text,'')
             AND COALESCE(type,'') = COALESCE($4,'')
           LIMIT 1`,
          [websiteId, path, parameter, type]
        );
      }

      if (existingRes.rowCount > 0) {
        const found = existingRes.rows[0];
        const setClauses = [];
        const params = [];
        let idx = 1;

        const pushCol = (colName, value) => {
          if (has(colName)) {
            setClauses.push(`${colName} = $${idx}`);
            params.push(value);
            idx++;
          }
        };

        pushCol('scanner', scanner);
        pushCol('path', path);
        pushCol('parameter', parameter);
        pushCol('type', type);
        if (has('raw')) pushCol('raw', rawFinding);
        else if (has('metadata')) pushCol('metadata', rawFinding);
        pushCol('normalized_severity', ruleApplied.normalized_severity);
        if (has('rule_tags')) pushCol('rule_tags', ruleApplied.rule_tags);
        else if (has('tags')) pushCol('tags', ruleApplied.rule_tags);

        if (has('updated_at')) {
          setClauses.push('updated_at = now()');
        }

        if (setClauses.length > 0) {
          params.push(found.id);
          const sql = `UPDATE vulnerability_findings SET ${setClauses.join(', ')} WHERE id = $${params.length}`;
          await client.query(sql, params);
        }

        resultSummary.updated += 1;
        resultSummary.details.push({ fingerprint: (has('fingerprint') || has('scanner_fingerprint')) ? fingerprint : null, action: 'updated', id: found.id, path, status: found.status });
      } else {
        
        const insertCols = [];
        const placeholders = [];
        const insertVals = [];
        const insertedColsSet = new Set();
        let p = 1;

        const addInsert = (col, val) => {
          if (!has(col)) return;
          if (insertedColsSet.has(col)) return;
          insertedColsSet.add(col);
          insertCols.push(col);
          placeholders.push(`$${p}`);
          insertVals.push(val);
          p++;
        };

        addInsert('website_id', websiteId);
        addInsert('scan_id', scanId);

        addInsert('fingerprint', fingerprint);
        addInsert('scanner_fingerprint', fingerprint);

        addInsert('scanner', scanner);
        addInsert('path', path);
        addInsert('parameter', parameter);
        addInsert('type', type);
        addInsert('raw', rawFinding);
        addInsert('metadata', rawFinding);
        addInsert('normalized_severity', ruleApplied.normalized_severity);
        if (has('rule_tags')) addInsert('rule_tags', ruleApplied.rule_tags);
        else if (has('tags')) addInsert('tags', ruleApplied.rule_tags);

        addInsert('status', 'open');
        addInsert('new_since_last_scan', true);

        if (insertCols.length === 0) {
          if (has('website_id')) {
            const sr = await client.query(`INSERT INTO vulnerability_findings (website_id) VALUES ($1) RETURNING id`, [websiteId]);
            const newId = sr.rows && sr.rows[0] && sr.rows[0].id;
            resultSummary.inserted += 1;
            resultSummary.details.push({ fingerprint: (has('fingerprint') || has('scanner_fingerprint')) ? fingerprint : null, action: 'inserted', id: newId, path, status: 'open' });
          } else {
            resultSummary.details.push({ fingerprint: (has('fingerprint') || has('scanner_fingerprint')) ? fingerprint : null, action: 'skipped_no_columns', path });
          }
        } else {
          const sql = `INSERT INTO vulnerability_findings (${insertCols.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING id`;
          const insertRes = await client.query(sql, insertVals);
          const newId = insertRes.rows && insertRes.rows[0] && insertRes.rows[0].id;
          resultSummary.inserted += 1;
          resultSummary.details.push({ fingerprint: (has('fingerprint') || has('scanner_fingerprint')) ? fingerprint : null, action: 'inserted', id: newId, path, status: has('status') ? 'open' : null });
        }
      }
    }

    await client.query('COMMIT');
    return resultSummary;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    try { client.release(); } catch (e) {}
  }
}

module.exports = {
  getNormalizedSeverity,
  computeFingerprint,
  applyRules,
  processScan
};
