
process.env.VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY || 'FAKE_KEY_FOR_TESTS';
process.env.VIRUSTOTAL_RATE_PER_MIN = '1000000';

jest.mock('../../services/malwareService', () => ({
  fetchNextQueueJob: jest.fn(),
  markQueueJobAttempt: jest.fn(),
  removeQueueJob: jest.fn(),
  getCachedResult: jest.fn(),
  upsertMalwareResult: jest.fn()
}));

const nock = require('nock');

afterEach(() => {
  nock.cleanAll();
  jest.resetAllMocks();
});

const { processJob } = require('../../workers/virusTotalWorker');
const malwareService = require('../../services/malwareService');

describe('virusTotalWorker.processJob', () => {
  test('processes a job with positives and upserts result', async () => {
    const sha = 'aaabbbccc111';
    const vtResp = {
      data: {
        attributes: {
          last_analysis_stats: { malicious: 2, suspicious: 1, harmless: 50 }
        }
      }
    };

    malwareService.getCachedResult.mockResolvedValue(null);
    malwareService.upsertMalwareResult.mockResolvedValue({ id: 123, sha256: sha });

    const vt = nock('https://www.virustotal.com', {
      reqheaders: { 'x-apikey': process.env.VIRUSTOTAL_API_KEY }
    }).get(`/api/v3/files/${sha}`).reply(200, vtResp);

    const fakeJob = { id: 999, sha256: sha, related_vuln_id: 77 };
    const res = await processJob(fakeJob);

    expect(res.processed).toBe(true);
    expect(res.positives).toBe(3);
    expect(malwareService.upsertMalwareResult).toHaveBeenCalled();
    expect(malwareService.removeQueueJob).toHaveBeenCalledWith(fakeJob.id);

    vt.done();
  });

  test('uses cache if present and links vuln', async () => {
    const sha = 'cachedsha';
    const cached = { id: 222, sha256: sha };
    malwareService.getCachedResult.mockResolvedValue(cached);

    const fakeJob = { id: 50, sha256: sha, related_vuln_id: 88 };
    const res = await processJob(fakeJob);

    expect(res.fromCache).toBe(true);
    expect(malwareService.removeQueueJob).toHaveBeenCalledWith(fakeJob.id);
  });

  test('handles not_found (404) by caching short ttl', async () => {
    const sha = 'notfoundsha';
    malwareService.getCachedResult.mockResolvedValue(null);

    const vt = nock('https://www.virustotal.com')
      .get(`/api/v3/files/${sha}`)
      .reply(404, { error: 'not found' });

    malwareService.upsertMalwareResult.mockResolvedValue({ id: 333 });

    const fakeJob = { id: 555, sha256: sha };
    const res = await processJob(fakeJob);

    expect(res.notFound).toBe(true);
    expect(malwareService.upsertMalwareResult).toHaveBeenCalled();
    expect(malwareService.removeQueueJob).toHaveBeenCalledWith(fakeJob.id);

    vt.done();
  });
});
