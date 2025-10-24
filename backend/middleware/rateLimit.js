const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit'); 

function userRateLimiter(opts = {}) {
  const windowMs = opts.windowMs || 60 * 60 * 1000; 
  const max = typeof opts.max === 'number' ? opts.max : 10;

  return rateLimit({
    windowMs,
    max,
    keyGenerator: (req ) => {
      if (req.user && req.user.id) return String(req.user.id);
      return ipKeyGenerator(req);
    },
    handler: (req, res) => {
      res.status(429).json({ error: 'too_many_requests' });
    },
  });
}

module.exports = { userRateLimiter };
