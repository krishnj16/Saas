jest.mock('../utils/db', () => require('./__mocks__/db'));
const pool = require('../utils/db');

const dns = require('dns');
jest.spyOn(dns.promises, 'resolve');

const { resolveAndEnqueueIPs } = require('../services/scanService');

describe('scanService', () => {
  beforeEach(() => {
    pool.__setupResults([]);
    dns.promises.resolve.mockReset();
  });

  test('resolves hostname and enqueues ip lookups', async () => {
    const scanId = '1111-2222-3333';
    dns.promises.resolve.mockResolvedValue(['1.1.1.1', '2.2.2.2']);

    const count = await resolveAndEnqueueIPs(scanId, ['example.com']);
    expect(count).toBe(2);

    const calls = pool.__getCalls();
    const hasScanIpsInsert = calls.some(c => /INSERT INTO scan_ips/i.test(c.text));
    const hasQueueInsert = calls.some(c => /INSERT INTO ip_reputation_queue/i.test(c.text));
    expect(hasScanIpsInsert).toBe(true);
    expect(hasQueueInsert).toBe(true);
  });

  test('handles literal IP without DNS call', async () => {
    const scanId = 's2';
    dns.promises.resolve.mockRejectedValue(new Error('should not be called'));
    const count = await resolveAndEnqueueIPs(scanId, ['8.8.8.8']);
    expect(count).toBe(1);
  });
});
