const rateLimit = require('express-rate-limit');

if (process.env.NODE_ENV === 'test') {
  module.exports = (req, res, next) => next();
  return;
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Try again later.' },
});

module.exports = authLimiter;
