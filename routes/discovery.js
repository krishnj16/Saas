const logger = require('../services/logger');
const express = require('express');
const router = express.Router();
const log = (...a) => logger.info(new Date().toISOString(), ...a);

let discoveryWorker;
try {
  discoveryWorker = require('../workers/discoveryWorker');
  log('[routes/discovery] loaded discoveryWorker:', Object.keys(discoveryWorker || {}));
} catch (e) {
  log('[routes/discovery] discoveryWorker require failed:', e?.message || e);
  discoveryWorker = null;
}

const handler = discoveryWorker && typeof discoveryWorker.discoverForScanTask === 'function'
  ? discoveryWorker.discoverForScanTask
  : null;

if (!handler) {
  log('[routes/discovery] discoverForScanTask not available; registering fallback route that returns 501.');
  router.post('/discover', async (req, res) => {
    res.status(501).json({
      error: 'discovery not available',
      message: 'Discovery worker is not configured in this environment.'
    });
  });
} else {
  router.post('/discover', async (req, res, next) => {
    try {
      await handler(req.body || req, { req, res, next });
    } catch (err) {
      next(err);
    }
  });
}

module.exports = router;
