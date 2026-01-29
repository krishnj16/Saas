

const express = require('express');
const router = express.Router();

let logger = console;
try {
  logger = require('../services/logger');
} catch (e) {
}


function safeRequire(path) {
  try {
    const mod = require(path);
    logger.info && logger.info(`[routes/index] loaded ${path}`);
    return mod;
  } catch (err) {
    logger.warn && logger.warn(`[routes/index] optional module not loaded: ${path} — ${err && err.message}`);
    return null;
  }
}


function safeMount(basePath, maybeRouter) {
  if (!maybeRouter) {
    logger.info && logger.info(`[routes/index] skipping mount ${basePath} (module missing)`);
    return;
  }

  if (typeof basePath !== 'string' || !basePath.startsWith('/')) {
    logger.error && logger.error(`[routes/index] refusing to mount router with unsafe basePath: ${basePath}`);
    return;
  }

  const looksLikeRouter = typeof maybeRouter === 'function' || (maybeRouter && (Array.isArray(maybeRouter.stack) || typeof maybeRouter.handle === 'function'));
  if (!looksLikeRouter) {
    logger.error && logger.error(`[routes/index] module at ${basePath} does not look like an express router. Skipping.`);
    return;
  }

  try {
    router.use(basePath, maybeRouter);
    logger.info && logger.info(`[routes/index] mounted ${basePath}`);
  } catch (err) {
    logger.error && logger.error(`[routes/index] failed to mount ${basePath}: ${err && err.message}`);
  }
}

const authRoutes = safeRequire('./auth.routes');
const websitesRoutes = safeRequire('./websites');
const findingsRoutes = safeRequire('./findings');

const discoveryRoutes = safeRequire('./discovery');
const malwareRoutes = safeRequire('./malwareRoutes');
const notificationsRoutes = safeRequire('./notifications');
const sitesRoutes = safeRequire('./sites');

safeMount('/auth', authRoutes);
safeMount('/websites', websitesRoutes);
safeMount('/findings', findingsRoutes);

safeMount('/discovery', discoveryRoutes);
safeMount('/malware', malwareRoutes);
safeMount('/notifications', notificationsRoutes);
safeMount('/sites', sitesRoutes);

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

router.use((req, res, next) => {
  if (req.path && req.path !== '/') {
    return res.status(404).json({ error: 'not_found' });
  }
  next();
});

module.exports = router;
