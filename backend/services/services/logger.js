/**
 * Shim to satisfy requires like require('../services/logger') from injector subfolders.
 * This file forwards to the real backend/services/logger.js (which we already created).
 */
module.exports = require('../logger');
