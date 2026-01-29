
const { Queue } = require('bullmq');
require('dotenv').config();

(async () => {
  const connection = { host: process.env.REDIS_HOST || '127.0.0.1', port: process.env.REDIS_PORT || 6379 };
  const q = new Queue('scanQueue', { connection });
  try {
    const job = await q.add('scan-website', { websiteId: '80331fc3-0365-4188-89f6-01a9d3903f21', requestedBy: 'dev-test' }, { removeOnComplete: true });
    logger.info('enqueued job id:', job.id);
  } catch (e) {
    logger.error('enqueue error:', e.stack || e);
  } finally {
    await q.close();
    process.exit(0);
  }
})();
