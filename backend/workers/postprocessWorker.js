const logger = require('../services/logger');
const { processScan } = require('../services/vulnProcessor');
const { pool } = require('../utils/db');

async function postprocessJob(scanId, websiteId) {
 
  const rawRows = await pool.query(`SELECT raw FROM raw_scan_results WHERE scan_id = $1`, [scanId]);
  const rawFindings = rawRows.rows.map(r => r.raw.findings).flat().filter(Boolean);

  

  const res = await processScan(scanId, websiteId, rawFindings);
  logger.info('Postprocess result', res);
  return res;
}

module.exports = { postprocessJob };
