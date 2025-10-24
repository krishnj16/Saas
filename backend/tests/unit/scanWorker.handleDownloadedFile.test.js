jest.mock('../../services/fileDownloader', () => ({
  downloadAndHash: jest.fn(),
  cleanupFile: jest.fn()
}));

jest.mock('../../services/malwareService', () => ({
  enqueueVTJob: jest.fn(),
  getCachedResult: jest.fn()
}));

const { downloadAndHash, cleanupFile } = require('../../services/fileDownloader');
const { enqueueVTJob, getCachedResult } = require('../../services/malwareService');
const { handleDownloadedFile } = require('../../workers/scanWorker');

describe('scanWorker.handleDownloadedFile', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('when cache hit links vuln and does not enqueue', async () => {
    downloadAndHash.mockResolvedValue({
      sha256: 'deadbeef',
      tmpFilePath: '/tmp/x',
      tmpDir: '/tmp/dir',
      totalBytes: 100,
      contentType: 'application/zip'
    });
    getCachedResult.mockResolvedValue({ id: 777 });

    const res = await handleDownloadedFile('https://example.com/x.zip', 'scan-uuid', 1234);
    expect(res.sha256).toBe('deadbeef');
    expect(enqueueVTJob).not.toHaveBeenCalled();
    expect(cleanupFile).toHaveBeenCalled();
  });

  test('when no cache enqueues job and cleans up', async () => {
    downloadAndHash.mockResolvedValue({
      sha256: 'cafebabe',
      tmpFilePath: '/tmp/x2',
      tmpDir: '/tmp/dir2',
      totalBytes: 200,
      contentType: 'application/zip'
    });
    getCachedResult.mockResolvedValue(null);
    const res = await handleDownloadedFile('https://example.com/x2.zip', 'scan-uuid', null);
    expect(enqueueVTJob).toHaveBeenCalledWith(expect.objectContaining({ sha256: 'cafebabe' }));
    expect(cleanupFile).toHaveBeenCalled();
    expect(res.sha256).toBe('cafebabe');
  });
});
