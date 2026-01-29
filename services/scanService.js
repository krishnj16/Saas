const { Queue } = require('bullmq');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const QUEUE_NAME = process.env.SCAN_QUEUE_NAME || 'scanQueue';
const connection = process.env.REDIS_URL 
  ? { connectionString: process.env.REDIS_URL }
  : { host: process.env.REDIS_HOST || '127.0.0.1', port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379 };

const scanQueue = new Queue(QUEUE_NAME, { connection });

async function enqueueScan({ websiteId, userId, options = {} }) {
  if (!websiteId) throw new Error('websiteId missing');
  const job = await scanQueue.add(
    'scan',
    { websiteId, requestedBy: userId, options },
    { removeOnComplete: true, removeOnFail: false }
  );
  return job.id;
}

module.exports = { enqueueScan };
