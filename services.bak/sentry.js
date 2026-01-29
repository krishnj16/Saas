

let Sentry;
const logger = require('./logger');

try {
  const real = require('@sentry/node');
  Sentry = real;
  if (!Sentry.Handlers) Sentry.Handlers = {
    requestHandler: () => (req, res, next) => next(),
    errorHandler: () => (err, req, res, next) => next(err),
  };
} catch (err) {
  try {
    logger && typeof logger.warn === 'function'
      ? logger.warn('[Sentry] package not installed — stub active')
      : console.warn('[Sentry] package not installed — stub active');
  } catch (e) {
    console.warn('[Sentry] package not installed — stub active (logger unavailable)');
  }

  Sentry = {
    Handlers: {
      requestHandler: () => (req, res, next) => next(),
      errorHandler: () => (err, req, res, next) => next(err),
    },
    captureException: (e) => {
      try {
        logger && typeof logger.error === 'function'
          ? logger.error('[Sentry][captureException]', e && (e.message || e))
          : console.error('[Sentry][captureException]', e && (e.message || e));
      } catch (e2) {
        console.error('[Sentry][captureException] fallback', e && (e.message || e));
      }
    },
    init: () => {
    },
  };
}

module.exports = Sentry;
