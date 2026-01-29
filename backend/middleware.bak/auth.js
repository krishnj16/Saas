const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  try {
    const cookieToken = req.cookies && req.cookies.access_token;
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

    const token = cookieToken || bearerToken;
    if (!token) return res.status(401).json({ error: 'missing_token' });

    const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || 'dev-secret';
    const payload = jwt.verify(token, secret);

    req.user = { id: payload.uid, role: payload.role || 'user' };
    next();
  } catch {
    return res.status(401).json({ error: 'invalid_token' });
  }
}

function authorizeRoles(...allowed) {
  return (req, res, next) => {
    if (!req.user || !allowed.includes(req.user.role)) {
      return res.status(403).json({ error: 'forbidden' });
    }
    next();
  };
}

module.exports = { authenticate, authorizeRoles };
