
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

    console.log('--- Jobs in scanQueue ---');
    console.log('Waiting:', waiting.map(j => ({ id: j.id, data: j.data })));
    console.log('Active:', active.map(j => ({ id: j.id, data: j.data })));
    console.log('Completed:', completed.map(j => ({ id: j.id, data: j.data })));
    console.log('Failed:', failed.map(j => ({ id: j.id, data: j.data })));
  } catch (err) {
    console.error('Error listing jobs:', err);
  } finally {
    await q.close();
    process.exit(0);
  }
})();
