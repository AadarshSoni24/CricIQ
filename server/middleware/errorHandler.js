/**
 * Global error handler middleware.
 */
function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err.message);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation error', details: err.message });
  }

  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      error: 'ML service unavailable',
      detail: 'FastAPI service is not running. Start it with: uvicorn main:app --port 8000',
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
}

module.exports = { errorHandler };
