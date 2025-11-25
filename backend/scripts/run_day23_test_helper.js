const { processScan } = require('../services/vulnProcessor');
const pool = require('../utils/db');

async function runTestHelper() {
  const websiteId = '11111111-1111-1111-1111-111111111111';
  const scanA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const scanB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  const findingsA = [
    { scanner: 'nikto', scanner_severity: 'High', path: '/admin', parameter: 'id', type: 'sqli', exploitability_score: 8 },
    { scanner: 'nikto', scanner_severity: 'Low', path: '/login', parameter: 'username', type: 'xss', exploitability_score: 0 }
  ];

  await processScan(scanA, websiteId, findingsA);

  const findingsB = [
    { scanner: 'nikto', scanner_severity: 'High', path: '/admin', parameter: 'id', type: 'sqli', exploitability_score: 8 },
    { scanner: 'nikto', scanner_severity: 'Medium', path: '/contact', parameter: null, type: 'info', exploitability_score: 0 }
  ];

  await processScan(scanB, websiteId, findingsB);

  const res = await pool.query(
    `SELECT path, status, new_since_last_scan FROM vulnerability_findings WHERE website_id=$1 ORDER BY path`,
    [websiteId]
  );
  return res.rows;
}
if (require.main === module) {
  runTestHelper().then(rows => {
    logger.info('Rows:', rows);
    process.exit(0);
  }).catch(err => {
    logger.error(err);
    process.exit(1);
  });
}

module.exports = { runTestHelper };
