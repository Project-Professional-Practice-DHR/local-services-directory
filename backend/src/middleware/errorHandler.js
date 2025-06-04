const { logger, Sentry } = require('../utils/logger');
const config = require('../../config/env');

// Base API Error class
class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = `ERR${statusCode}`;
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Specific error types for common errors
class ValidationError extends ApiError {
  constructor(message = 'Validation failed', errors = {}) {
    super(400, message, true);
    this.errors = errors;
    this.errorCode = 'VALIDATION_ERROR';
  }
}

class AuthenticationError extends ApiError {
  constructor(message = 'Authentication failed') {
    super(401, message, true);
    this.errorCode = 'AUTH_ERROR';
  }
}

class AuthorizationError extends ApiError {
  constructor(message = 'You do not have permission to perform this action') {
    super(403, message, true);
    this.errorCode = 'FORBIDDEN';
  }
}

class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(404, message, true);
    this.errorCode = 'NOT_FOUND';
  }
}

class ConflictError extends ApiError {
  constructor(message = 'Resource already exists') {
    super(409, message, true);
    this.errorCode = 'CONFLICT';
  }
}

class RateLimitError extends ApiError {
  constructor(message = 'Too many requests, please try again later') {
    super(429, message, true);
    this.errorCode = 'RATE_LIMIT';
  }
}

// Error converter to standardize errors
const errorConverter = (err, req, res, next) => {
  let error = err;
  
  if (!(error instanceof ApiError)) {
    const statusCode = 
      error.statusCode || 
      error instanceof SyntaxError ? 400 : 
      error.name === 'JsonWebTokenError' ? 401 :
      error.name === 'TokenExpiredError' ? 401 :
      500;
    
    const message = error.message || 'Internal Server Error';
    const isOperational = statusCode < 500;
    
    error = new ApiError(statusCode, message, isOperational, err.stack);
    
    // Handle specific error types
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = {};
      err.errors.forEach(e => { errors[e.path] = e.message; });
      error = new ValidationError('Validation failed', errors);
    }
    
    if (error.name === 'JsonWebTokenError') {
      error = new AuthenticationError('Invalid authentication token');
    }
    
    if (error.name === 'TokenExpiredError') {
      error = new AuthenticationError('Authentication token expired');
    }
  }
  
  next(error);
};

// Central error handler middleware
const errorHandler = (err, req, res, next) => {
  const { statusCode, message, errorCode, isOperational, errors, stack } = err;

  // Set locals for development/test environments
  res.locals.errorMessage = message;

  // Log the error with appropriate level
  const errorObject = {
    statusCode,
    errorCode,
    message,
    isOperational,
    stack,
    user: req.user ? req.user.id : 'unauthenticated',
    path: req.path,
    method: req.method,
    requestId: req.requestId
  };

  if (statusCode >= 500) {
    logger.error('Server error', { error: errorObject });
    // Track in Sentry if available
    if (config.isProduction && Sentry) {
      Sentry.captureException(err);
    }
  } else {
    logger.warn('Client error', { error: errorObject });
  }

  // Create standardized response
  const response = {
    status: 'error',
    code: errorCode,
    message,
  };

  // Add validation errors if present
  if (errors) {
    response.errors = errors;
  }

  // Add stack trace in development
  if (config.isDevelopment) {
    response.stack = stack;
  }

  // Add Sentry error ID in production
  if (config.isProduction && Sentry && res.sentry) {
    response.errorId = res.sentry;
  }

  res.status(statusCode).json(response);
};

// Function to handle uncaught exceptions and unhandled rejections
const setupErrorCatching = (app) => {
  // Catch 404 errors
  app.use((req, res, next) => {
    next(new NotFoundError(`Route ${req.originalUrl} not found`));
  });
  
  // Convert errors to APIError objects
  app.use(errorConverter);
  
  // Global error handler
  app.use(errorHandler);
  
  // Process-level error handling
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', { reason, promise });
    // Don't exit in production - let the process manager handle restarts
    if (!config.isProduction) {
      process.exit(1);
    }
  });
  
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error });
    // Always exit on uncaught exceptions after logging
    process.exit(1);
  });
};

module.exports = {
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  errorConverter,
  errorHandler,
  setupErrorCatching
};