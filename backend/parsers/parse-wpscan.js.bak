const fs = require('fs').promises;
const { Client } = require('pg');

module.exports = async function parseWpscan(jsonPath, opts = {}) {
  const verified = !!opts.verifiedByWpvulndb;
  const raw = await fs.readFile(jsonPath, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse JSON:', e);
    throw e;
  }
  if (data.scan_aborted) {
    console.warn('WPScan aborted:', data.scan_aborted);
    return;
  }

  const findings = [];
  if (data.plugins && typeof data.plugins === 'object') {
    for (const [pluginName, plugin] of Object.entries(data.plugins)) {
      if (plugin.vulnerabilities && Array.isArray(plugin.vulnerabilities)) {
        for (const v of plugin.vulnerabilities) {
          findings.push({
            scanner: 'wpscan',
            asset_type: 'plugin',
            asset_name: pluginName,
            title: v.title || v.name || v.slug || 'wp-plugin-vuln',
            description: v.description || null,
            references: v.references || {},
            severity: v.severity || null,
            url: data.target_url || null,
            evidence: v,
            verified_by_wpvulndb: verified
          });
        }
      }
    }
  }

  if (data.themes && typeof data.themes === 'object') {
    for (const [themeName, theme] of Object.entries(data.themes)) {
      if (theme.vulnerabilities && Array.isArray(theme.vulnerabilities)) {
        for (const v of theme.vulnerabilities) {
          findings.push({
            scanner: 'wpscan',
            asset_type: 'theme',
            asset_name: themeName,
            title: v.title || 'wp-theme-vuln',
            description: v.description || null,
            references: v.references || {},
            severity: v.severity || null,
            url: data.target_url || null,
            evidence: v,
            verified_by_wpvulndb: verified
          });
        }
      }
    }
  }
  if (data.core && data.core.vulnerabilities && Array.isArray(data.core.vulnerabilities)) {
    for (const v of data.core.vulnerabilities) {
      findings.push({
        scanner: 'wpscan',
        asset_type: 'core',
        asset_name: (data.core && data.core.version) || 'wordpress-core',
        title: v.title || 'wp-core-vuln',
        description: v.description || null,
        references: v.references || {},
        severity: v.severity || null,
        url: data.target_url || null,
        evidence: v,
        verified_by_wpvulndb: verified
      });
    }
  }

  if (findings.length === 0) {
    console.log('No findings found in output.');
    return;
  }
  const client = new Client({
    host: process.env.PGHOST || 'localhost',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
    database: process.env.PGDATABASE || 'saas_dev',
    port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
  });

  await client.connect();

  try {
    for (const f of findings) {
      const q = `
        INSERT INTO vulnerabilities
          (scan_task_id, scanner, type, title, description, severity, evidence, verified_by_wpvulndb, created_at)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, NOW())
        RETURNING id
      `;
      const params = [
        null,
        f.scanner,
        f.asset_type,
        f.title,
        f.description,
        f.severity,
        JSON.stringify(f.evidence),
        f.verified_by_wpvulndb
      ];
      const res = await client.query(q, params);
      console.log('Inserted vulnerability id:', res.rows[0].id);
    }
  } finally {
    await client.end();
  }
};
