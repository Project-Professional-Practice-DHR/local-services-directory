const { logger, Sentry } = require('../utils/logger');

// Class for API errors with status codes
class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Error converter to standardize errors
const errorConverter = (err, req, res, next) => {
  let error = err;
  
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || error instanceof SyntaxError ? 400 : 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, false, err.stack);
  }
  
  next(error);
};

// Central error handler middleware
const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;
  
  if (process.env.NODE_ENV === 'production' && !err.isOperational) {
    statusCode = 500;
    message = 'Internal Server Error';
  }
  
  // Set locals for development/test environments
  res.locals.errorMessage = err.message;
  
  // Log the error
  const errorObject = {
    statusCode,
    message,
    stack: err.stack,
    user: req.user ? req.user.id : 'unauthenticated',
    path: req.path,
    method: req.method,
  };
  
  if (statusCode >= 500) {
    logger.error('Server error', { error: errorObject });
    // Track in Sentry if available
    if (process.env.NODE_ENV === 'production' && Sentry) {
      Sentry.captureException(err);
    }
  } else {
    logger.warn('Client error', { error: errorObject });
  }
  
  // Send standardized response
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    ...(process.env.NODE_ENV === 'production' && Sentry ? 
        { errorId: res.sentry } : {}),
  });
};

module.exports = {
  ApiError,
  errorConverter,
  errorHandler
};