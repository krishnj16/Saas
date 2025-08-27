// backend/middleware/errorHandler.js
module.exports = (err, req, res, next) => {
  console.error(err && err.stack ? err.stack : err); // log real error
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "Something went wrong" });
};
