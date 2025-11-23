

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { randomUUID } = require('crypto');
const { saveScanOutput } = require('../workers/saveScanOutput');
const { processScanResult } = require('../workers/processScanResult');

logger.info(' fakeScanTest.js starting...');

(async function test() {
  const scanTaskId = randomUUID();
  logger.info('Generated scanTaskId:', scanTaskId);

  const fakeObj = {
    plugins: {
      'example-plugin': {
        version: '1.2.3',
        vulnerabilities: [
          {
            title: 'Fake XSS',
            description: 'Testing unified parser after JSON fixes',
            severity: 'high',
            path: '/wp-content/plugins/example-plugin/vuln.php',
            parameter: 'q',
            evidence: '<script>alert(1)</script>',
          },
        ],
      },
    },
  };

  try {
    logger.info('1) Saving raw scan output into scan_outputs...');
    const saved = await saveScanOutput({
      scanTaskId,
      scannerName: 'wpscan',
      rawText: JSON.stringify(fakeObj),
    });
    logger.info(' Saved scan_output id:', saved && saved.id ? saved.id : saved);

    logger.info('2) Calling processScanResult to parse & insert unified vulnerabilities...');
    const inserted = await processScanResult({
      scanTaskId,
      scannerName: 'wpscan',
      rawJson: fakeObj,
    });

    logger.info(' processScanResult returned. Inserted count:', Array.isArray(inserted) ? inserted.length : '(not an array)');
    if (Array.isArray(inserted) && inserted.length > 0) {
      logger.info('First inserted row (sample):');
      logger.info(JSON.stringify(inserted[0], null, 2));
    } else {
      logger.info('⚠️ No vulnerabilities were inserted (empty array).');
    }
  } catch (err) {
    logger.error('Smoke test error (full stack):');
    if (err && err.stack) logger.error(err.stack);
    else logger.error(err);
    if (err && typeof err === 'object') {
      try {
        const debugParts = {
          message: err.message,
          code: err.code,
          severity: err.severity,
          detail: err.detail,
          where: err.where,
        };
        logger.error('Error details:', JSON.stringify(debugParts, null, 2));
      } catch (ignore) {}
    }
  } finally {
    setTimeout(() => process.exit(0), 50);
  }
})();
