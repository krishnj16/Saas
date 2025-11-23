const logger = require('../services/logger');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function runCommand(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, Object.assign({ stdio: 'inherit' }, opts));
    child.on('error', (err) => reject(err));
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with ${code}`));
    });
  });
}

async function main() {
  const target = process.argv[2];
  const outputPathArg = process.argv[3];

  if (!target) {
    logger.error('Usage: node workers/wpscan-worker.js <target-url> [outputPath]');
    process.exit(1);
  }


  const outDir = outputPathArg
    ? path.dirname(path.resolve(process.cwd(), outputPathArg))
    : path.resolve(process.cwd(), 'scans', 'wpscan');

  const outputFile = outputPathArg
    ? path.resolve(process.cwd(), outputPathArg)
    : path.join(outDir, 'result.json');

  fs.mkdirSync(outDir, { recursive: true });
  logger.info('Output folder:', outDir);
  logger.info('Expected output file:', outputFile);

  const winOutDir = path.resolve(outDir);

  if (!process.env.WPSCAN_TOKEN) {
    logger.warn('NOTE: WPSCAN_TOKEN not set. WPVulnDB lookups will be skipped (verified_by_wpvulndb = false).');
  }
  try {
    await runCommand('docker', ['version']);
  } catch (err) {
    logger.error('Docker CLI not available.');
    process.exit(2);
  }

  const dockerArgs = [
    'run', '--rm',
    ...(process.env.WPSCAN_TOKEN ? ['--env', `WPSCAN_API_TOKEN=${process.env.WPSCAN_TOKEN}`] : []),
    '--mount', `type=bind,source=${winOutDir},target=/output`,
    'wpscanteam/wpscan:latest',
    '--url', target,
    '--enumerate', 'vp,vt,tt,u',
    '--format', 'json',
    '-o', '/output/result.json'
  ];

  logger.info('Running WPScan docker. This may take a minute...');

  try {

    await runCommand('docker', ['pull', 'wpscanteam/wpscan:latest'], {
      env: Object.assign({}, process.env, { MSYS_NO_PATHCONV: '1' })
    });

    await runCommand('docker', dockerArgs, {
      env: Object.assign({}, process.env, { MSYS_NO_PATHCONV: '1' })
    });


    if (!fs.existsSync(outputFile)) {
      logger.error('Expected output file not found at', outputFile);
      process.exit(3);
    }

    const parseWpscan = require('../parsers/parse-wpscan');
    const verified = !!process.env.WPSCAN_TOKEN; 
    await parseWpscan(outputFile, { verifiedByWpvulndb: verified });

    logger.info('Scan complete and parsed into DB.');
    process.exit(0);
  } catch (err) {
    logger.error('Worker failed:', err.message || err);
    process.exit(4);
  }
}

main();
