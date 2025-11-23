const jwt = require('jsonwebtoken');
const config = require('../services/config');

module.exports = function protect(req, res, next) {
  if (config.NODE_ENV === 'test') {
    req.user = { id: 'test-user' };
    return next();
  }

  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = auth.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, config.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
