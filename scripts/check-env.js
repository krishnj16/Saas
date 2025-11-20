try {
  const config = require('../services/config');
  console.log('ENV OK:', {
    NODE_ENV: config.NODE_ENV,
    hasDatabaseUrl: !!config.DATABASE_URL,
    hasJwtSecret: !!config.JWT_SECRET
  });
  process.exit(0);
} catch (err) {
  console.error('ENV INVALID:', err && err.message ? err.message : err);
  process.exit(1);
}
