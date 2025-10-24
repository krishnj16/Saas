// checkJob.js
require('dotenv').config();
const { Queue } = require('bullmq');

const connection = process.env.REDIS_URL
  ? { connectionString: process.env.REDIS_URL }
  : { host: process.env.REDIS_HOST || '127.0.0.1', port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379 };

(async () => {
  const q = new Queue(process.env.SCAN_QUEUE_NAME || 'scanQueue', { connection });
  const id = process.argv[2];
  if (!id) { console.log('Usage: node checkJob.js <jobId>'); process.exit(0); }
  const job = await q.getJob(id);
  if (!job) { console.log('Job not found in queue:', id); process.exit(0); }
  const state = await job.getState();
  console.log('Job', id, 'state ->', state);
  console.log('Job data ->', job.data);
  console.log('Attempts made:', job.attemptsMade);
  console.log('Return value:', job.returnvalue);
  process.exit(0);
})();
