let Sentry;

try {
  const real = require('@sentry/node');
  const dsn = process.env.SENTRY_DSN || '';

  if (dsn.trim()) {
    real.init({
      dsn,
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACE_RATE || '0.1'),
      environment: process.env.NODE_ENV || 'development',
    });
    console.log('[Sentry] initialized');
  } else {
    console.warn('[Sentry] DSN empty — running with no-op handlers');
  }

  if (!real.Handlers) {
    real.Handlers = {
      requestHandler: () => (req, res, next) => next(),
      errorHandler: () => (err, req, res, next) => next(err),
    };
  }

  Sentry = real;
} catch (err) {
  console.warn('[Sentry] package not installed — stub active');
  Sentry = {
    Handlers: {
      requestHandler: () => (req, res, next) => next(),
      errorHandler: () => (err, req, res, next) => next(err),
    },
    captureException: (e) => {
      console.warn('[Sentry stub] captureException:', e?.message || e);
    },
  };
}

module.exports = Sentry;
