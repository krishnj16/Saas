
const path = require('path');
const runCommand = require('../tools/runCommand');

async function main() {
  try {
    const scriptPath = path.join(__dirname, 'hello.js');
    const out = await runCommand('node', [scriptPath]);
    logger.info('NODE SCRIPT OUTPUT:', out);
    if (out !== 'Hello from child Node script!') {
      logger.error('Unexpected node script output');
      process.exit(2);
    }
    logger.info('Node child script test passed');
  } catch (err) {
    logger.error('Node child script test failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) main();
