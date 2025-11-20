
const path = require('path');
const runCommand = require('../tools/runCommand');

async function main() {
  try {
    const scriptPath = path.join(__dirname, 'hello.js');
    const out = await runCommand('node', [scriptPath]);
    console.log('NODE SCRIPT OUTPUT:', out);
    if (out !== 'Hello from child Node script!') {
      console.error('Unexpected node script output');
      process.exit(2);
    }
    console.log('Node child script test passed');
  } catch (err) {
    console.error('Node child script test failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) main();
