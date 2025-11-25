const { spawn } = require('child_process');

/**
 * 
 * @param {string} cmd 
 * @param {string[]} args 
 * @param {object} [opts]
 * @returns {Promise<string>}
 */
function runCommand(cmd, args = [], opts = {}) {
  return new Promise((resolve, reject) => {
    const finalOpts = Object.assign({ shell: true }, opts);
    const child = spawn(cmd, args, finalOpts);

    let stdout = '';
    let stderr = '';

    if (child.stdout) {
      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });
    }

    child.on('error', (err) => {
      reject(new Error(`Failed to start command "${cmd}": ${err.message}`));
    });

    child.on('close', (code, signal) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        const msg = `Command "${cmd} ${args.join(' ')}" exited with code ${code}` +
                    (signal ? ` signal ${signal}` : '') +
                    (stderr ? `: ${stderr.trim()}` : '');
        reject(new Error(msg));
      }
    });
  });
}

module.exports = runCommand;
