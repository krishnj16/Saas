
const runCommand = require('../tools/runCommand');

async function main() {
  try {
    const out = await runCommand('echo', ['Hello']);
    console.log('ECHO TEST OUTPUT:', out);
    if (out !== 'Hello,') {
      console.error('Unexpected echo output');
      process.exit(2);
    }
    console.log('Echo test passed');
  } catch (err) {
    console.error('Echo test failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) main();
