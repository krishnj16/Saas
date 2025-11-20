

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { randomUUID } = require('crypto');
const { saveScanOutput } = require('../workers/saveScanOutput');
const { processScanResult } = require('../workers/processScanResult');

console.log(' fakeScanTest.js starting...');

(async function test() {
  const scanTaskId = randomUUID();
  console.log('Generated scanTaskId:', scanTaskId);

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
    console.log('1) Saving raw scan output into scan_outputs...');
    const saved = await saveScanOutput({
      scanTaskId,
      scannerName: 'wpscan',
      rawText: JSON.stringify(fakeObj),
    });
    console.log(' Saved scan_output id:', saved && saved.id ? saved.id : saved);

    console.log('2) Calling processScanResult to parse & insert unified vulnerabilities...');
    const inserted = await processScanResult({
      scanTaskId,
      scannerName: 'wpscan',
      rawJson: fakeObj,
    });

    console.log(' processScanResult returned. Inserted count:', Array.isArray(inserted) ? inserted.length : '(not an array)');
    if (Array.isArray(inserted) && inserted.length > 0) {
      console.log('First inserted row (sample):');
      console.log(JSON.stringify(inserted[0], null, 2));
    } else {
      console.log('⚠️ No vulnerabilities were inserted (empty array).');
    }
  } catch (err) {
    console.error('Smoke test error (full stack):');
    if (err && err.stack) console.error(err.stack);
    else console.error(err);
    if (err && typeof err === 'object') {
      try {
        const debugParts = {
          message: err.message,
          code: err.code,
          severity: err.severity,
          detail: err.detail,
          where: err.where,
        };
        console.error('Error details:', JSON.stringify(debugParts, null, 2));
      } catch (ignore) {}
    }
  } finally {
    setTimeout(() => process.exit(0), 50);
  }
})();
