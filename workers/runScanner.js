const { exec } = require('child_process');
const { saveScanOutput } = require('./saveScanOutput');


function runScanner({ scanTaskId, scannerName, cmd, maxBuffer = 20 * 1024 * 1024 }) {
  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer }, async (error, stdout, stderr) => {
      const rawText = (stdout && stdout.trim()) || (stderr && stderr.trim()) || (error && error.message) || '';

      try {
        await saveScanOutput({ scanTaskId, scannerName, rawText });
      } catch (saveErr) {
        console.error('[runScanner] failed to save scan output:', saveErr);
      }

      if (error) {
        return reject({ error, stdout, stderr });
      }
      resolve({ stdout, stderr });
    });
  });
}

module.exports = { runScanner };
