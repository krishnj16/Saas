const { mapSeverity, ensureString } = require('./utils');

function parseWapiti(json) {
  if (!json || typeof json !== 'object') return [];

  const candidates = json.vulnerabilities || json.vulns || json.findings || [];
  if (!Array.isArray(candidates)) return [];

  return candidates.map(v => {
    const title = v.name || v.title || v.description || 'Wapiti Vulnerability';
    const severity = mapSeverity(v.level || v.severity || v.risk || 'low');
    const description = v.description || v.detail || '';
    const path = v.path || v.url || (v.target && v.target.path) || null;
    const parameter = v.parameter || null;
    const evidence = v.evidence || v.payload || v.request || null;

    return {
      scanner: 'wapiti',
      type: (v.type || inferTypeFromName(title)).toLowerCase(),
      severity,
      title: ensureString(title),
      description: ensureString(description),
      path,
      parameter,
      evidence: ensureString(evidence),
      raw: v,
    };
  });
}

function inferTypeFromName(name) {
  const t = String(name).toLowerCase();
  if (t.includes('xss')) return 'xss';
  if (t.includes('sql') || t.includes('sqli')) return 'sqli';
  if (t.includes('lfi')) return 'lfi';
  if (t.includes('csrf')) return 'csrf';
  if (t.includes('rce')) return 'rce';
  return 'other';
}

module.exports = { parseWapiti };
