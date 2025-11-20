jest.mock('../utils/db', () => require('./__mocks__/db'));
const pool = require('../utils/db');

const nock = require('nock');
const { getIpReputation, normalizeIpqsScore } = require('../services/ipReputationService');

describe('ipReputationService day25', () => {
  beforeAll(() => {
    process.env.IPQS_API_KEY = 'TEST_KEY';
    process.env.IP_REPUTATION_CACHE_TTL = '86400';
    process.env.IP_REPUTATION_CACHE_SHORT_TTL = '60';
  });

  beforeEach(() => {
    pool.__setupResults([]);
    nock.cleanAll();
  });

  afterEach(() => nock.cleanAll());

  test('returns cached when present', async () => {
    const future = new Date(Date.now() + 3600 * 1000).toISOString();
    pool.__setupResults([{ rowCount: 1, rows: [{ id: 1, ip: '1.2.3.4', provider: 'ipqs', score: 10, raw: {}, ttl_at: future, created_at: new Date().toISOString() }] }]);
    const out = await getIpReputation('1.2.3.4', 'ipqs');
    expect(out.cached).toBe(true);
    expect(out.result.score).toBe(10);
  });

  test('calls IPQS on cache miss and stores result', async () => {
    pool.__setupResults([
      { rowCount: 0, rows: [] },  
      { rowCount: 1, rows: [{ id: 7, ip: '9.9.9.9', provider: 'ipqs', score: 80, raw: {}, ttl_at: new Date(Date.now()+86400*1000).toISOString(), created_at: new Date().toISOString() }] }
    ]);

    nock('https://ipqualityscore.com')
      .get(uri => uri.includes('/api/json/ip/'))
      .reply(200, { fraud_score: 80 });

    const out = await getIpReputation('9.9.9.9', 'ipqs');
    expect(out.cached).toBe(false);
    expect(out.result.score).toBe(80);
  });

  test('normalizeIpqsScore heuristics', () => {
    expect(normalizeIpqsScore({ fraud_score: 42 })).toBe(42);
    expect(normalizeIpqsScore({ recent_abuse: true })).toBeGreaterThan(0);
  });
});
