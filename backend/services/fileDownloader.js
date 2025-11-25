const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { pipeline } = require('stream');
const { promisify } = require('util');
const axios = require('axios');
const streamPipeline = promisify(pipeline);

const MAX_FILE_BYTES = 50 * 1024 * 1024; 
const ALLOWED_CONTENT_TYPES = [
  'application/zip',
  'application/x-zip-compressed',
  'application/octet-stream',
  'application/x-gzip',
  'application/gzip'
];

function isAllowedUrl(url) {
  try {
    const u = new URL(url);
    const hostname = u.hostname.toLowerCase();

    if (/\.(zip|tar\.gz|tgz|gz)$/i.test(u.pathname)) return true;

    const allowedHosts = ['downloads.wordpress.org', 'github.com', 'githubusercontent.com', 'cdn.jsdelivr.net'];
    if (allowedHosts.some(h => hostname.endsWith(h))) return true;

    return false;
  } catch (e) {
    return false;
  }
}

async function downloadAndHash(url) {
  if (!isAllowedUrl(url)) {
    const err = new Error('URL not allowed by downloader policy');
    err.code = 'URL_NOT_ALLOWED';
    throw err;
  }

  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'saas-download-'));
  const tmpFilePath = path.join(tmpDir, path.basename(new URL(url).pathname) || 'download.bin');

  const response = await axios({
    method: 'get',
    url,
    responseType: 'stream',
    timeout: 30_000,
    maxRedirects: 5,
    validateStatus: status => status >= 200 && status < 400
  });

  const contentType = (response.headers['content-type'] || '').split(';')[0];
  const contentLength = parseInt(response.headers['content-length'] || '0', 10);

  if (contentLength && contentLength > MAX_FILE_BYTES) {
    await cleanupFile(tmpFilePath, tmpDir);
    const err = new Error('File too large');
    err.code = 'FILE_TOO_LARGE';
    throw err;
  }

  if (contentType && !ALLOWED_CONTENT_TYPES.includes(contentType)) {
    if (!/\.(zip|tar\.gz|tgz|gz)$/i.test(url)) {
      await cleanupFile(tmpFilePath, tmpDir);
      const err = new Error('Disallowed content type');
      err.code = 'DISALLOWED_CONTENT_TYPE';
      throw err;
    }
  }

  const hash = crypto.createHash('sha256');
  let totalBytes = 0;

  const writer = fs.createWriteStream(tmpFilePath);
  response.data.on('data', chunk => {
    totalBytes += chunk.length;
    if (totalBytes > MAX_FILE_BYTES) {
      response.data.destroy(new Error('MAX_SIZE_EXCEEDED'));
    }
    hash.update(chunk);
  });

  try {
    await streamPipeline(response.data, writer);
  } catch (e) {
    await cleanupFile(tmpFilePath, tmpDir);
    throw e;
  }

  const sha256 = hash.digest('hex');

  return { sha256, tmpFilePath, tmpDir, totalBytes, contentType };
}

async function cleanupFile(tmpFilePath, tmpDir) {
  try {
    if (tmpFilePath) await fs.promises.unlink(tmpFilePath).catch(() => {});
    if (tmpDir) await fs.promises.rmdir(tmpDir).catch(() => {});
  } catch (e) {
  }
}

module.exports = { downloadAndHash, cleanupFile };
