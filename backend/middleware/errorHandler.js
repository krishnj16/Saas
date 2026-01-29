module.exports = (err, req, res, next) => {
  try {
    console.error(`[${req?.id || 'no-id'}]`, err);
  } catch (e) {
    console.error('Error while logging error', e);
  }

  if (err && err.code === '23505') {
    return res.status(409).json({
      success: false,
      requestId: req?.id,
      error: 'duplicate',
      detail: err.detail || 'Resource already exists'
    });
  }

  if (err && err.code === '23503') {
    return res.status(400).json({
      success: false,
      requestId: req?.id,
      error: 'invalid_reference',
      detail: err.detail || 'Foreign key constraint failed'
    });
  }

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    requestId: req?.id,
    message: err.message || 'Internal Server Error',
  });
};
