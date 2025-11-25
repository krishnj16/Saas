const { enqueueJob } = require('../lib/queue');

async function main() {
  for (let i = 0; i < 5; i++) {
    await enqueueJob({ type: 'failForFirstN', idx: i, createdAt: Date.now() });
  }
  logger.info('Enqueued 5 failForFirstN jobs');
  process.exit(0);
}

main().catch(e => { logger.error(e); process.exit(1); });
