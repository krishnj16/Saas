const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { runForSite, runAllPending } = require('../services/injector/index');

const argv = yargs(hideBin(process.argv))
  .option('site-id', { type: 'string', describe: 'Site ID to scan' })
  .option('dry-run', { type: 'boolean', default: false, describe: 'Do not write to DB' })
  .argv;

if (argv['dry-run']) process.env.DRY_RUN = 'true';

(async () => {
  try {
    if (argv['siteId'] || argv['site-id']) {
      await runForSite(argv['site-id'] || argv['siteId'], { dryRun: argv['dry-run'] });
    } else {
      await runAllPending({ dryRun: argv['dry-run'] });
    }
    process.exit(0);
  } catch (err) {
    console.error('Injector CLI error', err);
    process.exit(1);
  }
})();
