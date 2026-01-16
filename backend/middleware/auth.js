// const jwt = require('jsonwebtoken');

// function authenticate(req, res, next) {
//   if (req.headers['x-test-bypass'] === 'true') {
//     req.user = {
//       id: 'dev-user',
//       email: 'dev@example.com',
//       role: 'admin',
//       createdAt: new Date().toISOString()
//     };
//     return next();
//   }

//   try {
//     const cookieToken = req.cookies && req.cookies.access_token;
//     const authHeader = req.headers.authorization;
//     const bearerToken = authHeader && authHeader.startsWith('Bearer ')
//       ? authHeader.split(' ')[1]
//       : null;

//     const token = cookieToken || bearerToken;
//     if (!token) return res.status(401).json({ error: 'missing_token' });

//     const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || 'dev-secret';
//     const payload = jwt.verify(token, secret);

//     req.user = {
//       id: payload.uid || payload.userId || payload.id,
//       email: payload.email || null,
//       role: payload.role || 'user',
//       createdAt: payload.createdAt || null
//     };

//     next();
//   } catch (err) {
//     return res.status(401).json({ error: 'invalid_token' });
//   }
// }

// function authorizeRoles(...allowed) {
//   return (req, res, next) => {
//     if (req.headers['x-test-bypass'] === 'true') return next();
//     if (!req.user || !allowed.includes(req.user.role)) {
//       return res.status(403).json({ error: 'forbidden' });
//     }
//     next();
//   };
// }

// module.exports = { authenticate, authorizeRoles };

const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  try {
    const token =
      req.cookies?.access_token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (!token) {
      return res.status(401).json({ error: 'missing_token' });
    }

    const secret =
      process.env.ACCESS_TOKEN_SECRET ||
      process.env.JWT_SECRET ||
      'dev-secret';

    const payload = jwt.verify(token, secret);

    if (!payload || !payload.uid) {
      return res.status(401).json({ error: 'invalid_token' });
    }

    req.user = {
      id: payload.uid,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid_token' });
  }
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    // roles should come from DB later, not JWT
    if (!req.user) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    if (!allowedRoles || allowedRoles.length === 0) {
      return next();
    }

    return res.status(403).json({ error: 'forbidden' });
  };
}

module.exports = { authenticate, authorizeRoles };
