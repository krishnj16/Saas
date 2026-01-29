const fs = require('fs');
const path = require('path');
const nock = require('nock');

const { downloadAndHash, cleanupFile } = require('../../services/fileDownloader');

describe('fileDownloader', () => {
  const sampleZipPath = path.join(__dirname, 'fixtures', 'sample.zip');
  beforeAll(() => {
    const fixturesDir = path.join(__dirname, 'fixtures');
    if (!fs.existsSync(fixturesDir)) fs.mkdirSync(fixturesDir);
    if (!fs.existsSync(sampleZipPath)) {
      fs.writeFileSync(sampleZipPath, Buffer.from([0x50,0x4B,0x03,0x04,0x00,0x00]));
    }
  });

  afterAll(() => {
  });

  test('downloads file, computes sha256 and cleans up', async () => {
    const server = nock('https://example.com')
      .get('/file.zip')
      .replyWithFile(200, sampleZipPath, {
        'Content-Type': 'application/zip',
        'Content-Length': fs.statSync(sampleZipPath).size
      });

    const url = 'https://example.com/file.zip';
    const result = await downloadAndHash(url);
    expect(result).toHaveProperty('sha256');
    expect(result).toHaveProperty('tmpFilePath');
    expect(result).toHaveProperty('tmpDir');
    expect(result.totalBytes).toBeGreaterThan(0);
    expect(fs.existsSync(result.tmpFilePath)).toBe(true);

    await cleanupFile(result.tmpFilePath, result.tmpDir);
    expect(fs.existsSync(result.tmpFilePath)).toBe(false);
    expect(fs.existsSync(result.tmpDir)).toBe(false);

    server.done();
  });

  test('rejects disallowed URL', async () => {
    await expect(downloadAndHash('https://evil.example.com/shell.php'))
      .rejects.toThrow(/URL not allowed/);
  });
});
