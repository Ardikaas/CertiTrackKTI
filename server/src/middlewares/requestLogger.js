const logger = require("../utils/logger");

/**
 * Request logging middleware
 * Logs all incoming requests with timing information
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Store original end function
  const originalEnd = res.end;

  // Override end function to capture response time
  res.end = function (chunk, encoding) {
    // Restore original end function
    res.end = originalEnd;
    res.end(chunk, encoding);

    // Calculate duration
    const duration = Date.now() - start;

    // Log the request
    logger.request(req, res, duration);
  };

  next();
};

/**
 * Error logging middleware for async errors
 * Catches and logs errors that occur in async route handlers
 */
const asyncErrorLogger = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      logger.error("Async error caught", {
        error: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
      });
      next(err);
    });
  };
};

module.exports = { requestLogger, asyncErrorLogger };
