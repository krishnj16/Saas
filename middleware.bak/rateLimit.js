const rateLimit = require('express-rate-limit');

const userRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => process.env.NODE_ENV === 'test'
});

module.exports = { userRateLimiter };
