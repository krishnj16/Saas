module.exports = (err, req, res, next) => {
  console.error(err && err.stack ? err.stack : err); 
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "Something went wrong" });
};
