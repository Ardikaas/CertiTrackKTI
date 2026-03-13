const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const notFound = (req, res, next) => {
  const error = new AppError(`Not Found - ${req.originalUrl}`, 404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Log the error with detailed information
  logger.errorRequest(err, req, res);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    message = `Resource not found with id of ${err.value}`;
    statusCode = 404;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    message = 'Duplicate field value entered';
    statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map((val) => val.message).join(', ');
    statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token. Please log in again.';
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    message = 'Your token has expired. Please log in again.';
    statusCode = 401;
  }

  // SyntaxError (malformed JSON)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    message = 'Invalid JSON format in request body';
    statusCode = 400;
  }

  const response = {
    status: statusCode >= 400 && statusCode < 500 ? 'fail' : 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && {
      error: err.name,
      stack: err.stack,
      timestamp: new Date().toISOString(),
    }),
  };

  res.status(statusCode).json(response);
};

module.exports = { notFound, errorHandler };
