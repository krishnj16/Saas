const { enqueueJob } = require('../lib/queue');

async function main() {
  const N = 200;
  for (let i = 0; i < N; i++) {
    await enqueueJob({ type: 'test', idx: i, createdAt: Date.now() });
  }
  logger.info(`Enqueued ${N} test jobs`);
  process.exit(0);
}

main().catch(err => { logger.error(err); process.exit(1); });
