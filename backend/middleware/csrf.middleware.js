module.exports = function csrfMiddleware(req, res, next) {
  const unsafeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  if (
    req.path.startsWith('/api/auth/login') ||
    req.path.startsWith('/api/auth/signup') ||
    req.path.startsWith('/api/auth/refresh')
  ) {
    return next();
  }

  if (!unsafeMethods.includes(req.method)) {
    return next();
  }

  const csrfCookie = req.cookies?.csrf_token;
  const csrfHeader = req.headers['x-csrf-token'];

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({ error: 'csrf_invalid' });
  }

  next();
};
