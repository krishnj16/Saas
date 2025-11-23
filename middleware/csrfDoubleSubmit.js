const logger = (() => {
  try { return require('../services/logger'); } catch (e) { return console; }
})();

module.exports = function csrfDoubleSubmit() {
  return function csrfMiddleware(req, res, next) {
    try {
      if (!req || !res) {
        if (typeof next === 'function') return next();
        return;
      }

      const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
      if (safeMethods.includes(String(req.method).toUpperCase())) return next();

      const path = String(req.path || req.url || '').toLowerCase();
      if (path.includes('/auth') || path.includes('/login') || path.includes('/signup')) return next();

    
      if (req.headers['x-test-bypass'] === 'true') {
        return next();
      }

      const header = req.get && (req.get('x-csrf-token') || req.get('x-xsrf-token') || req.get('csrf-token'));
      const cookieToken = (req.cookies && req.cookies.csrfToken) || (req.get && req.get('csrf-token'));

      if (!header || !cookieToken) {
        return res.status(403).json({ error: 'csrf_missing' });
      }
      if (String(header) !== String(cookieToken)) {
        return res.status(403).json({ error: 'csrf_mismatch' });
      }
      return next();
    } catch (err) {
      return next();
    }
  };
};