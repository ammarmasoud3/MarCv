'use strict';

/**
 * server/middleware/errorHandler.js
 * Central Express error-handling middleware.
 * Must be registered AFTER all routes (4-argument signature).
 */

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status  = err.status  || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  // Log server-side for debugging; avoid leaking stack traces to clients
  if (status >= 500) {
    console.error(`[MarCV] ${status} – ${message}`);
    if (process.env.NODE_ENV !== 'production') console.error(err.stack);
  }

  res.status(status).json({ error: message });
}

module.exports = errorHandler;
