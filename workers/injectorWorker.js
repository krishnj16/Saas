const logger = require('../services/logger');


const { runAllPending } = require('../services/injector/index');

async function scheduledRun() {
  logger.info('[injectorWorker] scheduled run start', new Date().toISOString());
  try {
    await runAllPending({ dryRun: process.env.DRY_RUN === 'true' });
    logger.info('[injectorWorker] scheduled run completed');
  } catch (err) {
    logger.error('[injectorWorker] error', err);
  }
}

module.exports = { scheduledRun };

