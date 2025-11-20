
require('dotenv').config();
const { Queue } = require('bullmq');

const connection = process.env.REDIS_URL
  ? { connectionString: process.env.REDIS_URL }
  : { host: process.env.REDIS_HOST || '127.0.0.1', port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379 };

const q = new Queue(process.env.SCAN_QUEUE_NAME || 'scanQueue', { connection });


async function enqueueWebsiteScan({ websiteId, userId }) {
  const jobId = await enqueueFunction(websiteId); 

  console.log(` Enqueued job with ID: ${jobId} for website: ${websiteId}`);

  await logAudit(userId || null, 'enqueue_scan_task', 'scan_task', jobId, {
    website_id: websiteId,
    queued_at: new Date().toISOString()
  });

  return jobId;
}

(async () => {
  const websiteUuid = process.argv[2];
  if (!websiteUuid) {
    console.error('Usage: node enqueueWithUuid.js <website-uuid>');
    process.exit(1);
  }
  try {
    const job = await q.add('scan', {
      websiteId: websiteUuid,
      requestedBy: 'devtest',
      options: { scanner: 'wpscan', timeoutMs: 2 * 60 * 1000 } 
    });
    console.log(' Enqueued job with ID:', job.id, 'for website:', websiteUuid);
  } catch (e) {
    console.error('Failed to enqueue job:', e && e.message ? e.message : e);
  } finally {
    process.exit(0);
  }
})();
