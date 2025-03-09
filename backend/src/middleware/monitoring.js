const promClient = require('prom-client');
const responseTime = require('response-time');
const { logger } = require('../utils/logger');

// Create a registry to register metrics
const register = new promClient.Registry();

// Add default metrics (CPU, memory usage, etc.)
promClient.collectDefaultMetrics({ register });

// Create HTTP request duration metric
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.03, 0.1, 0.3, 0.5, 1, 1.5, 2, 3, 5, 10]
});

// Create HTTP request total count metric
const httpRequestsTotalCount = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Create database query duration metric
const dbQueryDurationMicroseconds = new promClient.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query', 'table'],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

// Create error count metric
const errorCount = new promClient.Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'code']
});

// Register metrics
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestsTotalCount);
register.registerMetric(dbQueryDurationMicroseconds);
register.registerMetric(errorCount);

// Middleware to measure response time and count requests
const metricsMiddleware = responseTime((req, res, time) => {
  if (req.route) {
    const route = req.route.path;
    const method = req.method;
    const statusCode = res.statusCode;
    
    // Record HTTP request duration
    httpRequestDurationMicroseconds
      .labels(method, route, statusCode)
      .observe(time / 1000); // Convert from ms to seconds
    
    // Increment request counter
    httpRequestsTotalCount
      .labels(method, route, statusCode)
      .inc();
  }
});

// Middleware to expose metrics endpoint
const metricsEndpoint = (req, res) => {
  res.set('Content-Type', register.contentType);
  register.metrics().then(metrics => {
    res.end(metrics);
  });
};

// Function to record database query time
const recordDbQuery = (query, table, timeInMs) => {
  dbQueryDurationMicroseconds
    .labels(query, table)
    .observe(timeInMs / 1000); // Convert from ms to seconds
};

// Function to record errors
const recordError = (type, code = 'unknown') => {
  errorCount.labels(type, code).inc();
  
  // Also log the error
  logger.warn(`Error recorded: type=${type}, code=${code}`);
};

// Health check endpoint
const healthCheck = (req, res) => {
  const healthStatus = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || 'unknown',
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  };
  
  // Check database connection and other critical dependencies
  // For simplicity, we're not implementing actual checks here
  
  res.status(200).json(healthStatus);
};

module.exports = {
  metricsMiddleware,
  metricsEndpoint,
  recordDbQuery,
  recordError,
  healthCheck
};