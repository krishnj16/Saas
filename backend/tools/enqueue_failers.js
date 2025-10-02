const { enqueueJob } = require('../lib/queue');

async function main() {
  for (let i = 0; i < 5; i++) {
    await enqueueJob({ type: 'failForFirstN', idx: i, createdAt: Date.now() });
  }
  console.log('Enqueued 5 failForFirstN jobs');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
