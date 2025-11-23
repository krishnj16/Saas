module.exports = function csrfDoubleSubmit() {
  return function (req, res, next) {
    if (req.method === "GET" || req.method === "OPTIONS") {
      return next();
    }

    const cookieToken = req.cookies.csrfToken;
    const headerToken = req.headers["x-csrf-token"];

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      return res.status(403).json({ success: false, message: "CSRF failed" });
    }

    next();
  };
};
