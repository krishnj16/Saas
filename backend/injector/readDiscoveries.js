const pool = require('../utils/db');

async function getDiscoveriesForScan(scanTaskId) {
  const { rows } = await pool.query(
    `SELECT id, scan_task_id, url, action_url, method, param_name, input_type, sample_value, is_hidden, is_csrf, extra
     FROM scan_discovery WHERE scan_task_id = $1`,
    [scanTaskId]
  );
  return rows;
}

function buildInjectionPlan(discoveries) {
  const map = new Map();
  for (const d of discoveries) {
    const key = d.action_url || d.url;
    if (!map.has(key)) {
      map.set(key, { action_url: key, method: d.method || 'GET', params: [], discovered_from: new Set() });
    }
    const bucket = map.get(key);
    if (d.param_name) {
      bucket.params.push({
        param_name: d.param_name,
        input_type: d.input_type,
        sample_value: d.sample_value,
        is_hidden: d.is_hidden,
        is_csrf: d.is_csrf,
        extra: d.extra
      });
    } else if (d.input_type === 'rest_endpoint') {
      bucket.is_rest = true;
      bucket.rest_meta = bucket.rest_meta || [];
      bucket.rest_meta.push({ endpoint: d.action_url, discovered_from: d.url });
    }
    bucket.discovered_from.add(d.url);
  }

  const result = {};
  for (const [k, v] of map.entries()) {
    v.discovered_from = Array.from(v.discovered_from);
    result[k] = v;
  }
  return result;
}

module.exports = { getDiscoveriesForScan, buildInjectionPlan };
