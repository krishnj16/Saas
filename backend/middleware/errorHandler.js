module.exports = (err, req, res, next) => {
  console.error(`[${req.id}]`, err);

  const status = err.status || 500;

  res.status(status).json({
    success: false,
    requestId: req.id,
    message: err.message || "Internal Server Error",
  });
};
