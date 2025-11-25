const { Client } = require('pg');
(async () => {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Maina@123@localhost:5432/saasdb';
  const c = new Client({ connectionString });
  try {
    await c.connect();
    logger.info('Adding unique index ux_malware_results_sha256...');
    await c.query('CREATE UNIQUE INDEX IF NOT EXISTS ux_malware_results_sha256 ON malware_results(sha256);');
    logger.info('OK');
  } catch (e) {
    logger.error('FAILED', e.message || e);
    process.exitCode = 1;
  } finally {
    await c.end();
  }
})();
