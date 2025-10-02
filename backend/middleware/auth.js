require('dotenv').config();
const jwt = require('jsonwebtoken');
const authenticate = (req, res, next) => {
  try {
    const auth = req.headers.authorization || req.headers.Authorization;
    if (!auth) return res.status(401).json({ message: 'Authorization header missing' });

    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ message: 'Authorization format must be: Bearer <token>' });
    }

    const token = parts[1].trim();
    if (!token) return res.status(401).json({ message: 'Token missing' });

    const secret = process.env.JWT_SECRET || 'dev-secret';
    try {
      const payload = jwt.verify(token, secret);
      req.user = { id: payload.id, email: payload.email, role: payload.role };
      return next();
    } catch (err) {
      console.error('auth error:', err && err.message ? err.message : err);
      return res.status(401).json({ message: 'Token not valid' });
    }
  } catch (err) {
    console.error('auth middleware failed:', err && err.stack ? err.stack : err);
    return res.status(500).json({ message: 'Internal auth error' });
  }
};

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const userRole = req.user.role || 'user';
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      return next();
    } catch (err) {
      console.error('authorizeRoles error:', err && err.stack ? err.stack : err);
      return res.status(500).json({ message: 'Internal error' });
    }
  };
}

module.exports = { authenticate, authorizeRoles };
