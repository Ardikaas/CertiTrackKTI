const logger = require("../utils/logger");

/**
 * Request logging middleware
 * Logs all incoming requests with timing information
 */
// High-frequency polling endpoints — skip logging 304s to avoid log spam
const POLLING_PATHS = ["/api/v1/whatsapp/qr", "/api/v1/whatsapp/status"];

const requestLogger = (req, res, next) => {
  const start = Date.now();

  const originalEnd = res.end;

  res.end = function (chunk, encoding) {
    res.end = originalEnd;
    res.end(chunk, encoding);

    const duration = Date.now() - start;

    // Skip 304 responses from polling endpoints — they're just noise
    if (req.method === "GET" && POLLING_PATHS.includes(req.path) && res.statusCode === 304) {
      return;
    }

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
