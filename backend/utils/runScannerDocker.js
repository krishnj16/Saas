const { exec } = require('child_process');
const logger = require('../services/logger');

async function runScannerDocker(image, args, timeoutMs, runnerOpts) {
  return new Promise((resolve) => {
    // 1. Construct the Docker Command
    // We use --rm to clean up the container after it finishes
    // We mount the temp directory to capture the output file
    const mountFlag = `-v "${runnerOpts.mountHostDir}:/out"`;
    
    const cmd = `docker run --rm ${mountFlag} ${image} ${args.join(' ')}`;
    
    logger.info(`[Docker] Executing: ${cmd}`);

    const child = exec(cmd, { timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      // Docker logs often go to stderr even on success, so we capture both
      const combinedLogs = (stdout || '') + '\n' + (stderr || '');
      
      if (error) {
        logger.error(`[Docker] Failed/Timed out: ${error.message}`);
        return resolve({
          success: false,
          logs: combinedLogs,
          timedOut: error.signal === 'SIGTERM',
          code: error.code
        });
      }

      logger.info(`[Docker] Scan finished successfully.`);
      return resolve({
        success: true,
        logs: combinedLogs,
        outputContents: null // The worker will read the file from the mount dir
      });
    });
  });
}

module.exports = { runScannerDocker };