jest.mock('../utils/db', () => require('./__mocks__/db'));
const pool = require('../utils/db');

jest.mock('../services/ipReputationService', () => ({
  getIpReputation: jest.fn()
}));
const { getIpReputation } = require('../services/ipReputationService');

const worker = require('../scripts/process_ip_reputation_queue');

describe('ip reputation queue worker', () => {
  beforeAll(() => {
    process.env.IP_REPUTATION_SCORE_THRESHOLD = '80';
  });

  beforeEach(() => {
    pool.__setupResults([]);
    getIpReputation.mockReset();
  });

  test('processOne processes and creates notification for high score', async () => {
    const pendingRow = { id: 10, scan_id: 'scan-1', host_id: 1, ip: '9.9.9.9', provider: 'ipqs', attempts: 0, enqueued_at: new Date().toISOString() };

    pool.__setupResults([
      { rowCount: 0, rows: [] }, 
      { rowCount: 1, rows: [pendingRow] }, 
      { rowCount: 1, rows: [] } 
    ]);

    getIpReputation.mockResolvedValue({
      cached: false,
      result: { id: 55, ip: '9.9.9.9', provider: 'ipqs', score: 95, created_at: new Date().toISOString() }
    });

    await worker.processOne();

    const calls = pool.__getCalls();
    const notif = calls.find(c => /INSERT INTO notifications/i.test(c.text));
    expect(notif).toBeDefined();
    expect(JSON.stringify(notif.params || []).includes('9.9.9.9')).toBe(true);
  });
});
