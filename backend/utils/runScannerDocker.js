const { spawn, execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const logger = require('../services/logger');

function randomName(prefix = 'scanner') {
  return `${prefix}-${crypto.randomBytes(6).toString('hex')}`;
}


function runScannerDocker(image, imageArgs = [], timeoutMs = 5 * 60 * 1000, opts = {}) {
  const memoryMB = opts.memoryMB || 512;
  const cpus = opts.cpus || 0.5;
  const user = ('user' in opts) ? opts.user : '1000:1000';
  const mountHostDir = opts.mountHostDir || null;

  const isWindows = process.platform === 'win32';

  const startTime = new Date();
  const containerName = randomName('scanner');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scanner-'));
  const cidfilePath = path.join(tmpDir, 'cidfile');

  const dockerArgsBase = [
    'run',
    '--rm',
    `--memory=${memoryMB}m`,
    `--cpus=${cpus}`,
    '--cidfile', cidfilePath,
    '--name', containerName,
    '--security-opt', 'no-new-privileges',
    '--cap-drop', 'ALL',
  ];

  const volumeHost = mountHostDir || tmpDir;

  const shouldMountHost = !isWindows;
  if (shouldMountHost) {
    dockerArgsBase.push('-v', `${volumeHost}:/out:rw`);
  }

  const userArgs = (isWindows || !user) ? [] : ['--user', `${user}`];

  let effectiveImageArgs = imageArgs;
  if (isWindows && Array.isArray(imageArgs) && imageArgs.length > 0) {
    effectiveImageArgs = [];
    for (let i = 0; i < imageArgs.length; i++) {
      const a = imageArgs[i];
      if (a === '--output' || a === '-o') {
        i++; 
        continue;
      }
      effectiveImageArgs.push(a);
    }
  }

  const dockerArgs = [
    ...dockerArgsBase,
    ...userArgs,
    image,
    ...effectiveImageArgs,
  ];

  const cmd = 'docker';

  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const child = spawn(cmd, dockerArgs);

    logger.info('[runScannerDocker] started', { containerName, image, start: startTime.toISOString() });

    const timeoutTimer = setTimeout(async () => {
      timedOut = true;
      logger.warn('[runScannerDocker] timeout exceeded', { timeoutMs, containerName });
      try {
        let cid = null;
        try { cid = fs.readFileSync(cidfilePath, 'utf8').trim(); } catch (e) {}
        if (cid) {
          try { execFileSync('docker', ['kill', cid], { timeout: 15_000 }); } catch (e) {}
        } else {
          try { execFileSync('docker', ['kill', containerName], { timeout: 15_000 }); } catch (e) {}
        }
      } catch (e) {
        logger.error('[runScannerDocker] kill failed', { error: e });
      } finally {
        try { child.kill('SIGKILL'); } catch (e) {}
      }
    }, timeoutMs);

    child.stdout.on('data', (c) => { const s = c.toString(); stdout += s; process.stdout.write(`[${containerName}] STDOUT: ${s}`); });
    child.stderr.on('data', (c) => { const s = c.toString(); stderr += s; process.stderr.write(`[${containerName}] STDERR: ${s}`); });

    child.on('error', (err) => {
      clearTimeout(timeoutTimer);
      const stopTime = new Date();
      resolve({
        success: false,
        timedOut,
        code: null,
        stdout,
        stderr: stderr + '\n' + (err && err.message),
        containerId: null,
        logs: { containerName, startTime: startTime.toISOString(), stopTime: stopTime.toISOString() },
      });
    });

    child.on('close', async (code) => {
      clearTimeout(timeoutTimer);
      const stopTime = new Date();
      let containerId = null;
      try { if (fs.existsSync(cidfilePath)) containerId = fs.readFileSync(cidfilePath, 'utf8').trim(); } catch (e) {}
      const stdoutLen = Buffer.byteLength(stdout, 'utf8');
      const stderrLen = Buffer.byteLength(stderr, 'utf8');

      logger.info('[runScannerDocker] finished', {
        containerName,
        containerId,
        exitCode: code,
        stdoutLen,
        stderrLen,
        start: startTime.toISOString(),
        stop: stopTime.toISOString(),
      });

      if (isWindows) {
        try {
          const outPath = path.join(volumeHost, 'wpscan-result.json'); 
          if (stdout && stdout.trim().length > 0) {
            fs.writeFileSync(outPath, stdout, 'utf8');
          }
        } catch (e) {
          logger.warn('[runScannerDocker] failed writing stdout to tmp file on Windows', { message: e && e.message });
        }
      }

      if (isWindows && code !== 0 && (!stderr || stderr.length === 0)) {
        try {
          logger.warn('[runScannerDocker] first run failed on Windows with no stderr - retrying once as root (--user 0)');

          const fallbackArgs = [...dockerArgsBase, '--user', '0', image, ...imageArgs];
          const fallback = spawnSync('docker', fallbackArgs, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
          const fStdout = fallback.stdout || '';
          const fStderr = fallback.stderr || '';
          const fCode = fallback.status;

          stdout += fStdout;
          stderr += '\n[retry-root]\n' + fStderr;

          let fallbackContainerId = null;
          try { if (fs.existsSync(cidfilePath)) fallbackContainerId = fs.readFileSync(cidfilePath, 'utf8').trim(); } catch (e) {}

          logger.info('[runScannerDocker] fallback run', { exit: fCode, fallbackContainerId });

          if (fCode === 0) {
            let outputContents = null;
            if (shouldMountHost) {
              try { outputContents = fs.readFileSync(path.join(volumeHost, 'wpscan-result.json'), 'utf8'); } catch (e) {}
            } else {
              outputContents = stdout;
            }
            return resolve({
              success: true,
              timedOut,
              code: 0,
              stdout,
              stderr,
              containerId: fallbackContainerId || containerId,
              outputContents,
              logs: {
                containerName,
                containerId: fallbackContainerId || containerId,
                startTime: startTime.toISOString(),
                stopTime: new Date().toISOString(),
                exitCode: 0,
                stdoutLen: Buffer.byteLength(stdout, 'utf8'),
                stderrLen: Buffer.byteLength(stderr, 'utf8'),
                tmpDir,
                fallback: true,
              },
            });
          }
        } catch (e) {
          logger.warn('[runScannerDocker] fallback as root failed to execute', { message: e && e.message });
        }
      }


      let outputContents = null;
      if (shouldMountHost) {
        try { outputContents = fs.readFileSync(path.join(volumeHost, 'wpscan-result.json'), 'utf8'); } catch (e) { /* ignore */ }
      } else {
        if (stdout && stdout.trim().length > 0) outputContents = stdout;
      }

      resolve({
        success: code === 0 && !timedOut,
        timedOut,
        code,
        stdout,
        stderr,
        containerId,
        outputContents,
        logs: {
          containerName,
          containerId,
          startTime: startTime.toISOString(),
          stopTime: stopTime.toISOString(),
          exitCode: code,
          stdoutLen,
          stderrLen,
          tmpDir,
        },
      });
    });
  });
}

module.exports = { runScannerDocker };
