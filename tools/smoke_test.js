const { enqueueJob } = require('../lib/queue');
const db = require('../lib/db');

async function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

async function main() {
  const N = 50;
  for (let i = 0; i < N; i++) {
    await enqueueJob({ type: 'test', idx: i });
  }
  console.log(`Enqueued ${N} jobs — waiting for completion...`);
  const start = Date.now();
  const timeout = 2 * 60 * 1000; 
  while (Date.now() - start < timeout) {
    const res = await db.query("SELECT COUNT(*) FROM jobs WHERE status IN ('queued','processing')");
    const pending = Number(res.rows[0].count);
    console.log('pending:', pending);
    if (pending === 0) {
      console.log('All jobs processed.');
      process.exit(0);
    }
    await sleep(2000);
  }
  console.error('Timeout');
  process.exit(2);
}

main().catch(e=>{ console.error(e); process.exit(1); });
