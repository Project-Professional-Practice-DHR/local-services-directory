const winston = require('winston');
const Sentry = require('@sentry/node');
const { format, transports } = winston;

// Initialize Sentry for error tracking (only in production)
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.2,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express()
    ]
  });
}

// Custom format for logging
const customFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

// Define different transport options based on environment
const getTransports = () => {
  const transportsList = [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
        })
      )
    })
  ];

  // Add file transports in non-development environments
  if (process.env.NODE_ENV !== 'development') {
    transportsList.push(
      new transports.File({ 
        filename: 'logs/error.log', 
        level: 'error',
        maxsize: 10485760, // 10MB
        maxFiles: 5
      }),
      new transports.File({ 
        filename: 'logs/combined.log',
        maxsize: 10485760, // 10MB
        maxFiles: 5
      })
    );
  }

  return transportsList;
};

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: { service: 'local-services-api' },
  transports: getTransports(),
  exceptionHandlers: [
    new transports.File({ filename: 'logs/exceptions.log' })
  ],
  rejectionHandlers: [
    new transports.File({ filename: 'logs/rejections.log' })
  ]
});

// Add Sentry transport for error logs in production
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
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

// Add request logging middleware for Express
const requestLogger = (req, res, next) => {
  // Don't log health check endpoints
  if (req.path === '/health' || req.path === '/api/health') {
    return next();
  }
  
  const start = Date.now();
  res.on('finish', () => {
    const responseTime = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'http';
    
    logger.log(logLevel, `${req.method} ${req.originalUrl}`, {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('user-agent')
    });
  });
  
  next();
};

module.exports = {
  logger,
  requestLogger,
  Sentry
};