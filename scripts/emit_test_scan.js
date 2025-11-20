const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); 
const http = require('http');
const { initSockets } = require('../sockets');
const { emitScanStarted, emitScanProgress, emitVulnFound, emitScanFinished } = require('../workers/socketEmitter');



async function main() {
  const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('ok');
  });

  await new Promise((resolve, reject) => server.listen(0, (err) => (err ? reject(err) : resolve())));
  const port = server.address().port;
  console.log('Temporary test server listening on port', port);

  const io = initSockets(server, { corsOrigin: '*' });
  console.log('Socket.IO initialized for test script');

  await new Promise(r => setTimeout(r, 200));

  const user = {
    id: process.env.TEST_USER_ID || '1',
    email: process.env.TEST_USER_EMAIL || 'test@example.com',
    name: 'Test User',
  };

  const scan_task_id = `scan-${Date.now()}`;
  const website_id = 'https://example.com';

  emitScanStarted(user.id, { scan_task_id, website_id });

  for (let p = 10; p <= 100; p += 30) {
    await new Promise(r => setTimeout(r, 300));
    emitScanProgress(user.id, { scan_task_id, percent: p, current_scanner: p < 50 ? 'nikto' : 'snyk' });
  }

  await emitVulnFound(user, {
    scan_task_id,
    website_id,
    vuln: {
      id: 'v1',
      title: 'SQL injection in /login',
      severity: 'critical',
      path: '/login',
      cve: 'CVE-YYYY-XXXX',
    },
  });

  emitScanFinished(user.id, {
    scan_task_id,
    website_id,
    counts: { critical: 1, high: 2, medium: 0, low: 0 },
    summary: 'Finished. 1 critical found.',
  });

  console.log('test emits done');
  setTimeout(async () => {
    try {
      io.close();
      server.close();
      console.log('Temporary server and socket.io closed');
    } catch (e) {
      console.warn('Error closing test server/io', e.message);
    } finally {
      process.exit(0);
    }
  }, 500);
}

main().catch((err) => {
  console.error('emit_test_scan failed', err);
  process.exit(1);
});
