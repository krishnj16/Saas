// routes/index.js
// Central router aggregator — defensive and safe to load in any environment.

const express = require('express');
const router = express.Router();

// Use project logger if available, otherwise fallback to console
let logger = console;
try {
  // prefer your app logger when present
  logger = require('../services/logger');
} catch (e) {
  // keep console as fallback
}

/**
 * Safely require a module. Returns null if the module can't be loaded.
 * Logs the error but does not throw.
 */
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

/**
 * Safe mount for a router.
 * Ensures we only call router.use with a relative path and a proper Express router.
 */
function safeMount(basePath, maybeRouter) {
  if (!maybeRouter) {
    logger.info && logger.info(`[routes/index] skipping mount ${basePath} (module missing)`);
    return;
  }

  // Basic sanity: only allow relative base paths that start with "/"
  if (typeof basePath !== 'string' || !basePath.startsWith('/')) {
    logger.error && logger.error(`[routes/index] refusing to mount router with unsafe basePath: ${basePath}`);
    return;
  }

  // Ensure the object looks like an express router (has .use or .stack)
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

// Required routers (should exist in your codebase)
const authRoutes = safeRequire('./auth.routes');
const websitesRoutes = safeRequire('./websites');
const findingsRoutes = safeRequire('./findings');

// Optional / may-not-exist routers
const discoveryRoutes = safeRequire('./discovery');
const malwareRoutes = safeRequire('./malwareRoutes');
const notificationsRoutes = safeRequire('./notifications');
const sitesRoutes = safeRequire('./sites');

// Mount routers (use only relative base paths)
safeMount('/auth', authRoutes);
safeMount('/websites', websitesRoutes);
safeMount('/findings', findingsRoutes);

// optional mounts
safeMount('/discovery', discoveryRoutes);
safeMount('/malware', malwareRoutes);
safeMount('/notifications', notificationsRoutes);
safeMount('/sites', sitesRoutes);

// Example health route (keep simple)
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Generic API 404 under this router (optional — app-level 404 may be better)
router.use((req, res, next) => {
  // if already handled by a sub-route, next() will not be called
  if (req.path && req.path !== '/') {
    return res.status(404).json({ error: 'not_found' });
  }
  next();
});

module.exports = router;
