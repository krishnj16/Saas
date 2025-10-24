// enqueue.js
require('dotenv').config();
const { Queue } = require('bullmq');

const connection = process.env.REDIS_URL
  ? { connectionString: process.env.REDIS_URL }
  : { host: process.env.REDIS_HOST || '127.0.0.1', port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379 };

const q = new Queue(process.env.SCAN_QUEUE_NAME || 'scanQueue', { connection });

(async () => {
  const job = await q.add('scan', {
    websiteId: 1,            // change to valid website id in your DB
    requestedBy: 'devtest',
    options: { scanner: 'wpscan', timeoutMs: 2*60*1000 }
  });
  console.log('enqueued job', job.id);
  process.exit(0);
})();
