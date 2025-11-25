const { mapSeverity, ensureString } = require('./utils');

function parseWpscan(json) {
  if (!json || typeof json !== 'object') return [];

  const results = [];

  if (Array.isArray(json.vulnerabilities)) {
    json.vulnerabilities.forEach(v => results.push(mapWpscanVuln(v)));
  }

  if (json.plugins && typeof json.plugins === 'object') {
    Object.entries(json.plugins).forEach(([pluginName, pluginData]) => {
      const vulns = pluginData.vulnerabilities || pluginData.vuln || [];
      if (Array.isArray(vulns)) {
        vulns.forEach(v => {
          results.push(mapWpscanVuln(Object.assign({}, v, { __context: { plugin: pluginName, version: pluginData.version } })));
        });
      }
    });
  }

  if (json.themes && typeof json.themes === 'object') {
    Object.entries(json.themes).forEach(([themeName, themeData]) => {
      const vulns = themeData.vulnerabilities || [];
      if (Array.isArray(vulns)) {
        vulns.forEach(v => {
          results.push(mapWpscanVuln(Object.assign({}, v, { __context: { theme: themeName, version: themeData.version } })));
        });
      }
    });
  }

  if (Array.isArray(json.found_vulnerabilities)) {
    json.found_vulnerabilities.forEach(v => results.push(mapWpscanVuln(v)));
  }

  return results;
}

function mapWpscanVuln(v) {
  const title = v.title || v.name || v.cve || v.id || (v.risk ? `Vulnerability ${v.risk}` : 'Vulnerability');
  const description = v.description || v.summary || ensureString(v);
  const severity = mapSeverity(v.severity || v.dbi_severity || v.risk || v.cvss || 'low');
  const path = v.path || v.url || (v.entity && v.entity.path) || null;
  const parameter = v.parameter || null;
  const evidence = v.evidence || v.request || v.response || null;

  return {
    scanner: 'wpscan',
    type: (v.type || v.vuln_type || inferTypeFromTitle(title)).toLowerCase(),
    severity,
    title: ensureString(title),
    description: ensureString(description),
    path,
    parameter,
    evidence: ensureString(evidence),
    raw: v,
  };
}

function inferTypeFromTitle(title) {
  const t = String(title).toLowerCase();
  if (t.includes('xss')) return 'xss';
  if (t.includes('sql') || t.includes('sqli')) return 'sqli';
  if (t.includes('lfi') || t.includes('local file')) return 'lfi';
  if (t.includes('rce') || t.includes('remote code')) return 'rce';
  if (t.includes('csrf')) return 'csrf';
  return 'other';
}

module.exports = { parseWpscan };
