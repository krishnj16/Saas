const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const discovery = require('../workers/discoveryWorker');

(async () => {
  try {
    const url = process.argv[2];
    if (!url) {
      logger.info(' Usage: node scripts/run_discovery_debug.js <target_url>');
      logger.info('Example: node scripts/run_discovery_debug.js https://example.com');
      process.exit(1);
    }

    logger.info(' Starting discovery for:', url);

    await discovery.discoverForScanTask({
      scanTaskId: null, 
      startUrl: url,
      maxDepth: process.env.CRAWL_DEPTH ? parseInt(process.env.CRAWL_DEPTH, 10) : 2,
      headless: process.env.PUPPETEER_HEADLESS !== 'false',
      puppeteerArgs: (process.env.PUPPETEER_ARGS || '').split(' ').filter(Boolean)
    });

    logger.info('\n Discovery completed successfully!');
    logger.info('👉 Check the "scan_discovery" table for results.');
  } catch (err) {
    logger.error('\n Discovery failed:', err.message);
    logger.error(err);
  }
})();
