

const { runAllPending } = require('../services/injector/index');

async function scheduledRun() {
  console.log('[injectorWorker] scheduled run start', new Date().toISOString());
  try {
    await runAllPending({ dryRun: process.env.DRY_RUN === 'true' });
    console.log('[injectorWorker] scheduled run completed');
  } catch (err) {
    console.error('[injectorWorker] error', err);
  }
}

module.exports = { scheduledRun };

