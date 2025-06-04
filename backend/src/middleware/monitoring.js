const promClient = require('prom-client');
const { logger } = require('../utils/logger');
const os = require('os');
const config = require('../../config/env');

// Create a Registry to register metrics
const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({ register });

// HTTP request duration histogram
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in microseconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 5, 10, 30]
});

// HTTP request counter
const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Active requests gauge
const httpRequestsActive = new promClient.Gauge({
  name: 'http_requests_active',
  help: 'Number of active HTTP requests'
});

// Login attempts counter
const loginAttemptsTotal = new promClient.Counter({
  name: 'login_attempts_total',
  help: 'Total number of login attempts',
  labelNames: ['status']
});

// Payment processing counter
const paymentsProcessedTotal = new promClient.Counter({
  name: 'payments_processed_total',
  help: 'Total number of payments processed',
  labelNames: ['status', 'provider']
});

// Service booking counter
const bookingsCreatedTotal = new promClient.Counter({
  name: 'bookings_created_total',
  help: 'Total number of service bookings created',
  labelNames: ['status', 'service_type']
});

// API error counter
const apiErrorsTotal = new promClient.Counter({
  name: 'api_errors_total',
  help: 'Total number of API errors',
  labelNames: ['error_type', 'status_code']
});

// User activity gauge
const activeUsersGauge = new promClient.Gauge({
  name: 'active_users',
  help: 'Number of active users in the last 5 minutes'
});

// Register metrics
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestsActive);
register.registerMetric(loginAttemptsTotal);
register.registerMetric(paymentsProcessedTotal);
register.registerMetric(bookingsCreatedTotal);
register.registerMetric(apiErrorsTotal);
register.registerMetric(activeUsersGauge);

// System monitoring
const setupSystemMonitoring = () => {
  // Memory usage gauge
  const memoryUsage = new promClient.Gauge({
    name: 'node_memory_usage_bytes',
    help: 'Memory usage in bytes',
    labelNames: ['type']
  });
  
  // CPU usage gauge
  const cpuUsage = new promClient.Gauge({
    name: 'node_cpu_usage_percentage',
    help: 'CPU usage percentage',
    labelNames: ['core']
  });
  
  // Disk usage gauge
  const diskUsage = new promClient.Gauge({
    name: 'node_disk_usage_percentage',
    help: 'Disk usage percentage',
    labelNames: ['mountpoint']
  });
  
  register.registerMetric(memoryUsage);
  register.registerMetric(cpuUsage);
  register.registerMetric(diskUsage);
  
  // Update system metrics every minute
  setInterval(() => {
    try {
      // Memory metrics
      const mem = process.memoryUsage();
      memoryUsage.set({ type: 'rss' }, mem.rss);
      memoryUsage.set({ type: 'heapTotal' }, mem.heapTotal);
      memoryUsage.set({ type: 'heapUsed' }, mem.heapUsed);
      memoryUsage.set({ type: 'external' }, mem.external);
      
      // System memory
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      
      memoryUsage.set({ type: 'system_total' }, totalMem);
      memoryUsage.set({ type: 'system_free' }, freeMem);
      memoryUsage.set({ type: 'system_used' }, usedMem);
      
      // CPU metrics
      const cpus = os.cpus();
      cpus.forEach((cpu, i) => {
        const total = Object.values(cpu.times).reduce((acc, tv) => acc + tv, 0);
        const usage = 100 - (cpu.times.idle / total * 100);
        cpuUsage.set({ core: `cpu${i}` }, usage);
      });
      
      // Average CPU load
      const loadAvg = os.loadavg();
      cpuUsage.set({ core: 'load1' }, loadAvg[0]);
      cpuUsage.set({ core: 'load5' }, loadAvg[1]);
      cpuUsage.set({ core: 'load15' }, loadAvg[2]);
      
      // Disk usage (simple implementation - in production you might want to use a library)
      if (process.platform === 'linux') {
        const df = require('child_process').execSync('df -k').toString();
        const lines = df.split('\n').slice(1);
        
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 6) {
            const mountpoint = parts[5];
            const used = parseInt(parts[2], 10);
            const available = parseInt(parts[3], 10);
            const total = used + available;
            const percentage = (used / total) * 100;
            
            if (!isNaN(percentage)) {
              diskUsage.set({ mountpoint }, percentage);
            }
          }
        });
      }
    } catch (error) {
      logger.error('Error updating system metrics', { error });
    }
  }, 60000); // Update every minute
};

// Middleware to track HTTP requests
const metricsMiddleware = (req, res, next) => {
  // Skip metrics endpoint to avoid circular references
  if (req.path === '/metrics') {
    return next();
  }
  
  // Increment active requests counter
  httpRequestsActive.inc();
  
  // Track request duration
  const startTime = process.hrtime();
  
  // Capture original end method
  const originalEnd = res.end;
  
  // Override end method to capture metrics before response is sent
  res.end = function(...args) {
    // Calculate request duration
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds + nanoseconds / 1e9;
    
    // Normalize the route path to avoid high cardinality
    // (replace route parameters with placeholders)
    let route = req.path;
    
    // If using Express router, use the route pattern instead of the actual path
    if (req.route) {
      route = req.baseUrl + req.route.path;
    } else {
      // Simple parameter normalization for paths without route info
      route = route.replace(/\/[0-9a-f]{24}$/g, '/:id')
                   .replace(/\/[0-9a-f]{24}\//g, '/:id/')
                   .replace(/\/\d+/g, '/:id');
    }
    
    // Record metrics
    httpRequestDurationMicroseconds
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    httpRequestsTotal
      .labels(req.method, route, res.statusCode)
      .inc();
    
    // Track errors
    if (res.statusCode >= 400) {
      const errorType = res.statusCode >= 500 ? 'server_error' : 'client_error';
      apiErrorsTotal.labels(errorType, res.statusCode).inc();
    }
    
    // Decrement active requests counter
    httpRequestsActive.dec();
    
    // Call the original end method
    return originalEnd.apply(this, args);
  };
  
  next();
};

// Track login attempts
const trackLogin = (success) => {
  loginAttemptsTotal.labels(success ? 'success' : 'failure').inc();
};

// Track payment processing
const trackPayment = (status, provider = 'stripe') => {
  paymentsProcessedTotal.labels(status, provider).inc();
};

// Track booking creation
const trackBooking = (status, serviceType = 'general') => {
  bookingsCreatedTotal.labels(status, serviceType).inc();
};

// Update active users count
const updateActiveUsers = (count) => {
  activeUsersGauge.set(count);
};

// Metrics endpoint - exposes metrics for Prometheus
const metricsEndpoint = async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error('Error generating metrics', { error });
    res.status(500).end();
  }
};

// Initialize monitoring
const initMonitoring = (app) => {
  if (config.isProduction || config.isStaging) {
    // Set up system monitoring
    setupSystemMonitoring();
    
    // Add metrics middleware
    app.use(metricsMiddleware);
    
    // Expose metrics endpoint for Prometheus
    app.get('/metrics', metricsEndpoint);
    
    logger.info('Prometheus monitoring initialized');
  } else {
    logger.info('Prometheus monitoring not enabled in development/test mode');
  }
};

module.exports = {
  register,
  initMonitoring,
  trackLogin,
  trackPayment,
  trackBooking,
  updateActiveUsers,
  metricsMiddleware,
  httpRequestDurationMicroseconds,
  httpRequestsTotal,
  loginAttemptsTotal,
  paymentsProcessedTotal,
  bookingsCreatedTotal,
  apiErrorsTotal
};