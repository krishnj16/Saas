const { resolveAndEnqueueIPs } = require('../backend/services/scanService');
const worker = require('./process_ip_reputation_queue');

(async () => {
  await resolveAndEnqueueIPs('test-scan-1', ['example.com']);
  // process one queued item (call exported helper)
  await worker.processOne();
  console.log('done');
})();
