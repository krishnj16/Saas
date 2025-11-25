/**
 * Fetch discovery rows from scan_discovery table.
 * Implementations assume fields:
 * id, site_id, url, method, param_name, sample_value, html_snippet, observed_request_headers, site_origin
 */

const { pool } = require('../../utils/db');

async function fetchPending(limit = 100) {
  const q = `SELECT id, site_id, url, method, param_name, sample_value, html_snippet, observed_request_headers, site_origin
             FROM scan_discovery
             WHERE (last_injected_at IS NULL OR last_injected_at < (now() - interval '1 day'))
             ORDER BY created_at ASC
             LIMIT $1`;
  const r = await pool.query(q, [limit]);
  return r.rows;
}

async function fetchForSite(siteId, limit = 100) {
  const q = `SELECT id, site_id, url, method, param_name, sample_value, html_snippet, observed_request_headers, site_origin
             FROM scan_discovery
             WHERE site_id = $1
             ORDER BY created_at ASC
             LIMIT $2`;
  const r = await pool.query(q, [siteId, limit]);
  return r.rows;
}

async function markScanned(discoveryId) {
  const q = `UPDATE scan_discovery SET last_injected_at = now() WHERE id = $1`;
  await pool.query(q, [discoveryId]);
}

module.exports = { fetchPending, fetchForSite, markScanned };
