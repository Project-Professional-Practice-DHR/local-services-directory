const winston = require('winston');
const Sentry = require('@sentry/node');
const { format, transports } = winston;
const path = require('path');
const fs = require('fs');
const config = require('../../config/env');

// Ensure log directory exists
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Initialize Sentry for error tracking (only in production)
if (config.isProduction && config.services.sentry.dsn) {
  Sentry.init({
    dsn: config.services.sentry.dsn,
    environment: config.env,
    tracesSampleRate: 0.2,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express()
    ]
  });
}

// Custom format for console logs with colors
const consoleFormat = format.combine(
  format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  format.errors({ stack: true }),
  format.splat(),
  format.colorize(),
  format.printf(({ timestamp, level, message, ...meta }) => {
    const stack = meta.stack ? `\n${meta.stack}` : '';
    const metadata = Object.keys(meta).length && !meta.stack ? 
      `\n${JSON.stringify(meta, null, 2)}` : '';
    
    return `${timestamp} [${level}]: ${message}${stack}${metadata}`;
  })
);

// Format for file logs (without colors)
const fileFormat = format.combine(
  format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

// Define different transport options based on environment
const getTransports = () => {
  const transportsList = [
    new transports.Console({
      format: consoleFormat
    })
  ];

  // Add file transports in non-development environments or in all environments based on config
  if (!config.isDevelopment || config.enableDevFileLogs) {
    transportsList.push(
      new transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        format: fileFormat,
        maxsize: 10485760, // 10MB
        maxFiles: 5
      }),
      new transports.File({
        filename: path.join(logDir, 'combined.log'),
        format: fileFormat,
        maxsize: 10485760, // 10MB
        maxFiles: 5
      }),
      new transports.File({
        filename: path.join(logDir, 'http.log'),
        level: 'http',
        format: fileFormat,
        maxsize: 10485760, // 10MB
        maxFiles: 5
      })
    );
  }

  return transportsList;
};

// Create logger instance
const logger = winston.createLogger({
  level: config.logLevel || 'info',
  format: fileFormat,
  defaultMeta: { service: 'local-services-api' },
  transports: getTransports(),
  exceptionHandlers: [
    new transports.File({ 
      filename: path.join(logDir, 'exceptions.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ],
  rejectionHandlers: [
    new transports.File({ 
      filename: path.join(logDir, 'rejections.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
});

// Add Sentry transport for error logs in production
if (config.isProduction && config.services.sentry.dsn) {
  const sentryTransport = new winston.transports.Console({
    level: 'error',
    format: winston.format.simple(),
    handleExceptions: true,
    handleRejections: true
  });

  // Capture errors in Sentry before logging them
  sentryTransport.log = (info, callback) => {
    const { level, message, ...meta } = info;
    if (level === 'error') {
      if (meta.error instanceof Error) {
        Sentry.captureException(meta.error);
      } else {
        Sentry.captureMessage(message, {
          level: Sentry.Severity.Error,
          extra: meta
        });
      }
    }
    callback();
  };

  logger.add(sentryTransport);
}

// Morgan stream function for HTTP request logging
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

// Request logging middleware for Express
const requestLogger = (req, res, next) => {
  // Don't log health check endpoints
  if (req.path === '/health' || req.path === '/api/health' || req.path === '/metrics') {
    return next();
  }
  
  // Add request ID
  const requestId = req.headers['x-request-id'] || require('crypto').randomUUID();
  req.requestId = requestId;
  
  // Start timer
  const start = Date.now();
  
  // Add custom log method to the request object
  req.log = (level, message, meta = {}) => {
    logger.log(level, message, {
      requestId,
      path: req.path,
      method: req.method,
      ...meta
    });
  };
  
  // Log request details at start
  logger.http(`${req.method} ${req.originalUrl}`, {
    requestId,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    referer: req.headers.referer || req.headers.referrer,
  });
  
  // Add response listener to log completion
  res.on('finish', () => {
    const responseTime = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'http';
    
    logger.log(logLevel, `${req.method} ${req.originalUrl} ${res.statusCode} ${responseTime}ms`, {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('user-agent'),
      userId: req.user ? req.user.id : undefined
    });
  });
  
  next();
};

// Add simplified logging methods for common scenarios
logger.api = (message, data = {}) => {
  logger.info(`API: ${message}`, data);
};

logger.db = (message, data = {}) => {
  logger.debug(`DB: ${message}`, data);
};

logger.auth = (message, data = {}) => {
  logger.info(`AUTH: ${message}`, data);
};

logger.payment = (message, data = {}) => {
  logger.info(`PAYMENT: ${message}`, data);
};

logger.security = (message, data = {}) => {
  logger.warn(`SECURITY: ${message}`, data);
};

module.exports = {
  logger,
  requestLogger,
  Sentry
};