
const runCommand = require('../tools/runCommand');

async function main() {
  try {
    const out = await runCommand('echo', ['Hello']);
    logger.info('ECHO TEST OUTPUT:', out);
    if (out !== 'Hello,') {
      logger.error('Unexpected echo output');
      process.exit(2);
    }
    logger.info('Echo test passed');
  } catch (err) {
    logger.error('Echo test failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) main();
