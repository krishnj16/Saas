const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const discovery = require('../workers/discoveryWorker');

(async () => {
  try {
    const url = process.argv[2];
    if (!url) {
      console.log(' Usage: node scripts/run_discovery_debug.js <target_url>');
      console.log('Example: node scripts/run_discovery_debug.js https://example.com');
      process.exit(1);
    }

    console.log(' Starting discovery for:', url);

    await discovery.discoverForScanTask({
      scanTaskId: null, 
      startUrl: url,
      maxDepth: process.env.CRAWL_DEPTH ? parseInt(process.env.CRAWL_DEPTH, 10) : 2,
      headless: process.env.PUPPETEER_HEADLESS !== 'false',
      puppeteerArgs: (process.env.PUPPETEER_ARGS || '').split(' ').filter(Boolean)
    });

    console.log('\n Discovery completed successfully!');
    console.log('👉 Check the "scan_discovery" table for results.');
  } catch (err) {
    console.error('\n Discovery failed:', err.message);
    console.error(err);
  }
})();
