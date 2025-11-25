
const { Queue, QueueEvents } = require('bullmq');
require('dotenv').config();

(async () => {
  const connection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
  };

  const q = new Queue('scanQueue', { connection });

  try {
    const waiting = await q.getWaiting();
    const active = await q.getActive();
    const completed = await q.getCompleted();
    const failed = await q.getFailed();

    logger.info('--- Jobs in scanQueue ---');
    logger.info('Waiting:', waiting.map(j => ({ id: j.id, data: j.data })));
    logger.info('Active:', active.map(j => ({ id: j.id, data: j.data })));
    logger.info('Completed:', completed.map(j => ({ id: j.id, data: j.data })));
    logger.info('Failed:', failed.map(j => ({ id: j.id, data: j.data })));
  } catch (err) {
    logger.error('Error listing jobs:', err);
  } finally {
    await q.close();
    process.exit(0);
  }
})();
