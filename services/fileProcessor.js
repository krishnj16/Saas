const { enqueueVTJob, getCachedResult } = require('./malwareService');
const { cleanupFile } = require('./fileDownloader'); 

async function processFilePostHash({ sha256, tmpFilePath, tmpDir, scan_task_id = null, related_vuln_id = null }) {
  try {
    const cached = await getCachedResult(sha256);
    if (cached) {
      return { sha256, cached: true, malware_result: cached };
    }
    await enqueueVTJob({
      sha256,
      scan_task_id,
      related_vuln_id,
      file_path: tmpFilePath
    });
    return { sha256, queued: true };
  } finally {
    await cleanupFile(tmpFilePath, tmpDir);
  }
}

module.exports = { processFilePostHash };
