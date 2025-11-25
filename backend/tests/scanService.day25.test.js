jest.mock('../utils/db', () => require('./__mocks__/db'));
const pool = require('../utils/db');

const dns = require('dns');
jest.spyOn(dns.promises, 'resolve');

const { resolveAndEnqueueIPs } = require('../services/scanService');

describe('scanService resolveAndEnqueueIPs', () => {
  beforeEach(() => {
    pool.__setupResults([]);
    dns.promises.resolve.mockReset();
  });

  test('resolves hostnames and enqueues IPs', async () => {
    dns.promises.resolve.mockResolvedValue(['1.1.1.1', '2.2.2.2']);
    pool.__setupResults([
      { rowCount: 1, rows: [{ id: 100 }] }, 
      { rowCount: 1, rows: [{ id: 101 }] }, 
    ]);

    const c = await resolveAndEnqueueIPs('scan-1', ['example.com']);
    expect(c).toBe(2);

    const calls = pool.__getCalls();
    const hasScanIps = calls.some(c => /INSERT INTO scan_ips/i.test(c.text));
    const hasQueue = calls.some(c => /INSERT INTO ip_reputation_queue/i.test(c.text));
    expect(hasScanIps).toBe(true);
    expect(hasQueue).toBe(true);
  });

  test('handles literal IP without DNS call', async () => {
    dns.promises.resolve.mockImplementation(() => { throw new Error('should not be called'); });
    pool.__setupResults([
      { rowCount: 1, rows: [{ id: 200 }] }
    ]);
    const c = await resolveAndEnqueueIPs('scan-2', ['8.8.8.8']);
    expect(c).toBe(1);
  });
});
