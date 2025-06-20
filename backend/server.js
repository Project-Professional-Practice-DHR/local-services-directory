const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const multer = require('multer');
const { Client } = require('pg');  // PostgreSQL client
const fs = require('fs');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { check, validationResult } = require('express-validator');
const crypto = require('crypto');
const promClient = require('prom-client'); // Add Prometheus client
require("dotenv").config();

// Console styling utility - keep as is since it works well
const log = {
  // All your existing log utility code
  colors: {
    reset: "\x1b[0m",
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    // Bright colors
    brightRed: "\x1b[91m",
    brightGreen: "\x1b[92m",
    brightYellow: "\x1b[93m",
    brightBlue: "\x1b[94m",
    brightMagenta: "\x1b[95m",
    brightCyan: "\x1b[96m",
    brightWhite: "\x1b[97m",
  },
  
  // Text styles
  styles: {
    bold: "\x1b[1m",
    dim: "\x1b[2m",
    italic: "\x1b[3m",
    underline: "\x1b[4m",
    blink: "\x1b[5m",
    reverse: "\x1b[7m",
    hidden: "\x1b[8m",
  },
  
  // Backgrounds
  bg: {
    black: "\x1b[40m",
    red: "\x1b[41m",
    green: "\x1b[42m",
    yellow: "\x1b[43m",
    blue: "\x1b[44m",
    magenta: "\x1b[45m",
    cyan: "\x1b[46m",
    white: "\x1b[47m",
  },
  
  // Icons
  icon: {
    info: "ℹ️ ",
    success: "✅ ",
    warning: "⚠️ ",
    error: "❌ ",
    rocket: "🚀 ",
    server: "🖥️ ",
    database: "💾 ",
    security: "🔒 ",
    routes: "🛣️ ",
    test: "🧪 ",
    docs: "📚 ",
    user: "👤 ",
    config: "⚙️ ",
    loading: "⏳ ",
    arrow: "➡️ ",
  },
  
  // Log types
  info: (message) => {
    console.log(`${log.styles.bold}${log.colors.cyan}${log.icon.info} INFO:${log.colors.reset} ${message}`);
  },
  
  success: (message) => {
    console.log(`${log.styles.bold}${log.colors.green}${log.icon.success} SUCCESS:${log.colors.reset} ${message}`);
  },
  
  warning: (message) => {
    console.log(`${log.styles.bold}${log.colors.yellow}${log.icon.warning} WARNING:${log.colors.reset} ${message}`);
  },
  
  error: (message, error) => {
    console.error(`${log.styles.bold}${log.colors.red}${log.icon.error} ERROR:${log.colors.reset} ${message}`);
    if (error) {
      console.error(`${log.colors.dim}${error.stack || error}${log.colors.reset}`);
    }
  },
  
  section: (title) => {
    console.log(`\n${log.styles.bold}${log.colors.brightMagenta}${log.icon.arrow} ${title.toUpperCase()} ${log.colors.reset}`);
  },
  
  highlight: (message) => {
    console.log(`${log.styles.bold}${log.bg.blue}${log.colors.white} ${message} ${log.colors.reset}`);
  },
  
  item: (key, value, success = true) => {
    const icon = success ? log.icon.success : log.icon.error;
    const color = success ? log.colors.green : log.colors.red;
    console.log(`  ${icon} ${log.styles.bold}${key}:${log.colors.reset} ${color}${value}${log.colors.reset}`);
  }
};

// Create a Registry to register metrics (Prometheus monitoring)
const register = new promClient.Registry();

// Add default Prometheus metrics
promClient.collectDefaultMetrics({ register });

// Add custom metrics
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in microseconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 5, 10, 30]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const loginAttemptsTotal = new promClient.Counter({
  name: 'login_attempts_total',
  help: 'Total number of login attempts',
  labelNames: ['status']
});

// Register metrics
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestsTotal);
register.registerMetric(loginAttemptsTotal);

// Add unhandled rejection and exception handlers
process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection', { reason, promise });
  // Don't exit process here to allow graceful handling
});

process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception', error);
  // Don't exit process here immediately to allow logging
  // Instead, try to close server gracefully
  if (global.server) {
    log.warning('Attempting to close server gracefully due to uncaught exception');
    global.server.close(() => {
      log.info('Server closed due to uncaught exception');
      process.exit(1);
    });
    
    // Force close after timeout
    setTimeout(() => {
      log.error('Could not close server gracefully, forcing exit');
      process.exit(1);
    }, 5000);
  } else {
    // If server isn't defined yet, exit after a brief delay to allow logging
    setTimeout(() => process.exit(1), 1000);
  }
});

// Set up logger
let logger;
try {
  log.section('Initializing System Logger');
  
  logger = require('./src/utils/logger');
  log.success('Logger loaded successfully');
} catch (error) {
  log.error('Failed to load logger', error);
  // Create a simple fallback logger
  logger = {
    error: console.error,
    info: console.log,
    warn: console.warn
  };
}

// Initialize Express app
const app = express();

// THIS LINE NEEDS TO BE ADDED HERE
app.set('trust proxy', 1);

// Configure CORS with more specific settings
app.use(cors({
  origin: 'http://localhost:3000', // Your frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

const PORT = process.env.PORT || 5001;

// Environment variables check
log.section('Environment Variables Check');
log.item('DATABASE_URL', process.env.DATABASE_URL ? 'Set' : 'Missing', !!process.env.DATABASE_URL);
log.item('JWT_SECRET', process.env.JWT_SECRET ? 'Set' : 'Missing', !!process.env.JWT_SECRET);
log.item('NODE_ENV', process.env.NODE_ENV || 'Not set, defaulting to development');
log.item('GOOGLE_MAPS_API_KEY', process.env.GOOGLE_MAPS_API_KEY ? 'Set' : 'Missing', !!process.env.GOOGLE_MAPS_API_KEY);
log.item('STRIPE_SECRET_KEY', process.env.STRIPE_SECRET_KEY ? 'Set' : 'Missing', !!process.env.STRIPE_SECRET_KEY);

// Swagger configuration - keep your existing implementation
log.section('API Documentation Setup');
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Local Services Directory API',
      version: '1.0.0',
      description: 'API documentation for the Local Services Directory platform - a marketplace connecting customers with local service providers.',
      contact: {
        name: 'Project Team',
        email: 'yourname@university.edu'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server'
      }
    ],
    // Your existing Swagger configuration...
    tags: [
      {
        name: 'Authentication',
        description: 'API endpoints for user authentication'
      },
      {
        name: 'Users',
        description: 'User management operations'
      },
      {
        name: 'Services',
        description: 'Service management endpoints'
      },
      {
        name: 'Reviews',
        description: 'Service provider review management'
      },
      {
        name: 'Bookings',
        description: 'Appointment booking operations'
      },
      {
        name: 'Categories',
        description: 'Service categories and subcategories'
      },
      {
        name: 'Search',
        description: 'Search functionality for services and providers'
      },
      {
        name: 'Payments',
        description: 'Payment processing endpoints'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>'
        }
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message'
            },
            error: {
              type: 'string',
              description: 'Error details (only in development mode)'
            }
          },
          example: {
            message: 'An error occurred',
            error: 'Details about the error'
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication information is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                message: 'Unauthorized access'
              }
            }
          }
        },
        NotFoundError: {
          description: 'The requested resource was not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                message: 'Resource not found'
              }
            }
          }
        },
        ValidationError: {
          description: 'Invalid input provided',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string'
                  },
                  errors: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        field: {
                          type: 'string'
                        },
                        message: {
                          type: 'string'
                        }
                      }
                    }
                  }
                }
              },
              example: {
                message: 'Validation error',
                errors: [
                  {
                    field: 'email',
                    message: 'Must be a valid email address'
                  }
                ]
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    path.join(__dirname, './src/routes/*.js'),
    path.join(__dirname, './src/routes/**/*.js'),
    path.join(__dirname, './src/models/*.js'),
    path.join(__dirname, './server.js')
  ]
};

// Generate Swagger spec
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Add route for Swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Local Services Directory API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'none',
    filter: true,
    tagsSorter: 'alpha'
  }
}));

// Endpoint to serve the Swagger spec as JSON
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Add Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error('Error generating metrics', { error });
    res.status(500).end();
  }
});

// Add a simple test endpoint to verify Swagger is working
/**
 * @swagger
 * /api/test:
 *   get:
 *     summary: Test endpoint
 *     description: A simple test endpoint to verify the API is running
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: System is operational
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *             example:
 *               message: "API is running"
 *               timestamp: "2023-05-15T14:30:00Z"
 */
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

log.success(`API Documentation available at http://localhost:${PORT}/api-docs`);

// Ensure directories exist (logs, backups, uploads)
log.section('Directory Setup');
const dirs = [
  { path: path.join(__dirname, 'uploads'), name: 'uploads' },
  { path: path.join(__dirname, 'logs'), name: 'logs' },
  { path: path.join(__dirname, 'backups'), name: 'backups' }
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir.path)) {
    fs.mkdirSync(dir.path, { recursive: true });
    log.success(`Created ${dir.name} directory at ${dir.path}`);
  } else {
    log.info(`Using existing ${dir.name} directory at ${dir.path}`);
  }
});

// File storage configuration for uploads
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    // Generate a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter for uploads
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, JPG, PNG and PDF are allowed.'), false);
  }
};

// Configure multer for file uploads
const upload = multer({ 
  storage: fileStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Set up PostgreSQL client with better error handling for Neon.tech
log.section('Database Connection');
log.info('Connecting to Neon.tech PostgreSQL database...');

// Add timeout and keepalive options to PG client
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Neon.tech
  },
  query_timeout: 10000, // 10 second timeout for queries
  connectionTimeoutMillis: 10000, // 10 second connection timeout
  keepAlive: true, // Enable TCP keepalive
  keepAliveInitialDelayMillis: 30000 // 30 seconds initial delay
});

let pgClient = null;
client.connect()
  .then(() => {
    pgClient = client;
    log.success('Neon.tech PostgreSQL connection successful!');
  })
  .catch((err) => {
    log.error('PostgreSQL connection error', err);
    // Don't exit process here, just log the error
  });

// Add periodic ping to keep connection alive
const pgPingInterval = setInterval(() => {
  if (pgClient) {
    pgClient.query('SELECT 1')
      .then(() => {
        log.info('PostgreSQL connection ping successful');
      })
      .catch(err => {
        log.error('PostgreSQL ping failed, attempting reconnection', err);
        // Try to reconnect
        client.end();
        client.connect()
          .then(() => {
            pgClient = client;
            log.success('Neon.tech PostgreSQL reconnection successful!');
          })
          .catch((reconnectErr) => {
            log.error('PostgreSQL reconnection error', reconnectErr);
          });
      });
  }
}, 60000); // Ping every minute

// Database setup - with error handling
let sequelize;
try {
  log.info('Loading database configuration...');
  const dbModule = require("./config/database");
  sequelize = dbModule.sequelize;
  log.success('Database configuration loaded successfully');
} catch (error) {
  log.error('Failed to load database configuration', error);
  process.exit(1);
}

// Load app configuration - with error handling
let testConnection, syncDatabase;
try {
  log.info('Loading app configuration...');
  const appConfig = require('./config/app.config');
  if (!appConfig.database) {
    log.error('Database configuration not found in app.config');
    process.exit(1);
  }
  testConnection = appConfig.database.testConnection;
  syncDatabase = appConfig.database.syncDatabase;
  log.success('App configuration loaded successfully');
} catch (error) {
  log.error('Failed to load app configuration', error);
  process.exit(1);
}

// Load security middleware - with error handling
log.section('Security Middleware Setup');
let securityHeaders, enableCORS, authLimiter, generalLimiter, sanitizeInputs;
try {
  log.info('Loading security middleware...');
  const securityMiddleware = require('./src/middleware/security.middleware');
  securityHeaders = securityMiddleware.securityHeaders;
  enableCORS = securityMiddleware.enableCORS;
  authLimiter = securityMiddleware.authLimiter;
  generalLimiter = securityMiddleware.generalLimiter;
  sanitizeInputs = securityMiddleware.sanitizeInputs;
  log.success('Security middleware loaded successfully');
} catch (error) {
  log.error('Failed to load security middleware', error);
  process.exit(1);
}

// Apply middleware
log.section('Middleware Configuration');
try {
  log.info('Applying middleware...');
  app.use(securityHeaders); // Apply security headers
  app.use(enableCORS); // CORS support
  
  // Add metrics middleware with better error handling
  app.use((req, res, next) => {
    // Skip metrics endpoint to avoid circular references
    if (req.path === '/metrics') {
      return next();
    }
    
    try {
      // Track request duration
      const startTime = process.hrtime();
      
      // Capture original end method
      const originalEnd = res.end;
      
      // Override end method to capture metrics before response is sent
      res.end = function(...args) {
        try {
          // Calculate request duration
          const [seconds, nanoseconds] = process.hrtime(startTime);
          const duration = seconds + nanoseconds / 1e9;
          
          // Record metrics (wrapped in try/catch)
          try {
            httpRequestDurationMicroseconds
              .labels(req.method, req.path, res.statusCode)
              .observe(duration);
            
            httpRequestsTotal
              .labels(req.method, req.path, res.statusCode)
              .inc();
          } catch (metricError) {
            // Just log and continue if metrics fail
            log.error('Metrics recording error', metricError);
          }
          
          // Call the original end method
          return originalEnd.apply(this, args);
        } catch (endError) {
          log.error('Error in metrics middleware end override', endError);
          return originalEnd.apply(this, args);
        }
      };
      
      next();
    } catch (error) {
      log.error('Unexpected error in metrics middleware', error);
      next();
    }
  });
  
  // Use a smaller body size limit to prevent potential attacks
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  
  app.use(morgan("dev")); // Request logging
  app.use(sanitizeInputs); // Sanitize inputs
  app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploads directory
  log.success('Middleware applied successfully');
} catch (error) {
  log.error('Error applying middleware', error);
  process.exit(1);
}

// Add this to your server.js file, replacing the existing rate limiter setup
try {
  log.info('Applying rate limiters...');
  // Create a more lenient rate limiter for development
  const rateLimit = require('express-rate-limit');
  
  const developmentLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 200, // 200 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Only count failed requests
    message: { error: 'Too many requests, please try again later.' } // Ensure JSON response
  });

  // Create stricter rate limiter for authentication routes
  const developmentAuthLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 50, // 50 auth requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts, please try again later.' } // Ensure JSON response
  });

  // Apply the appropriate limiter based on environment
  if (process.env.NODE_ENV === 'production') {
    app.use('/api/auth', authLimiter); 
    app.use(generalLimiter);
  } else {
    // Use more lenient limits in development
    app.use('/api/auth', developmentAuthLimiter);
    app.use(developmentLimiter);
  }
  
  log.success('Rate limiters applied successfully');
} catch (error) {
  log.error('Error applying rate limiters', error);
  // Continue without rate limiters
}

// Load User model - with error handling
log.section('Models Initialization');
let User;
try {
  log.info('Loading User model...');
  const userModule = require('./src/models/User');
  User = userModule.User;
  log.success('User model loaded successfully');
} catch (error) {
  log.error('Failed to load User model', error);
  // Continue without User model, handle failures in routes
}

// Authentication Middleware with improved error handling
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Bearer token is missing' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ message: 'Token has expired' });
        }
        return res.status(403).json({ message: 'Invalid token' });
      }
      req.user = user;
      next();
    });
  } catch (error) {
    log.error('Authentication error', error);
    return res.status(500).json({ message: 'Authentication system error' });
  }
};

// Role-based Authorization Middleware with improved error handling
const authorize = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      if (!roles.includes(req.user.userType)) {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
      
      next();
    } catch (error) {
      log.error('Authorization error', error);
      return res.status(500).json({ message: 'Authorization system error' });
    }
  };
};

// File upload routes
log.section('File Upload Routes');

app.post('/upload/profile-picture', authenticateToken, upload.single('profilePicture'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file provided' });
  }
  
  try {
    // Get the file URL (relative path)
    const fileUrl = `/uploads/${req.file.filename}`;
    
    // Update user profile picture in database
    if (!User) {
      return res.status(500).json({ message: 'User model not available' });
    }
    
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // If user already has a profile picture, delete the old one
    if (user.profilePicture) {
      const oldPicturePath = path.join(__dirname, user.profilePicture.replace(/^\//, ''));
      if (fs.existsSync(oldPicturePath)) {
        fs.unlinkSync(oldPicturePath);
      }
    }
    
    user.profilePicture = fileUrl;
    await user.save();
    
    log.success(`Profile picture uploaded for user ${user.id}`);
    res.status(200).json({ 
      message: 'Profile picture uploaded successfully',
      fileUrl 
    });
  } catch (error) {
    log.error('Error uploading profile picture', error);
    res.status(500).json({ message: 'Error uploading profile picture' });
  }
});

// Service images upload route
app.post('/upload/service-images', authenticateToken, authorize('provider'), upload.array('serviceImages', 5), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No files provided' });
  }
  
  try {
    // Get the file URLs (relative paths)
    const fileUrls = req.files.map(file => `/uploads/${file.filename}`);
    
    // In a real app, associate these images with a service listing
    // For university project, just return the URLs
    log.success(`${req.files.length} service images uploaded by provider ${req.user.id}`);
    res.status(200).json({ 
      message: 'Service images uploaded successfully',
      fileUrls 
    });
  } catch (error) {
    log.error('Error uploading service images', error);
    res.status(500).json({ message: 'Error uploading service images' });
  }
});

// Protected Route (requires JWT token) with improved error handling
app.get("/profile", authenticateToken, async (req, res) => {
  try {
    log.info(`Profile request received for user ${req.user.id}`);
    
    if (!User) {
      return res.status(500).json({ message: 'User model not available' });
    }
    
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash', 'verificationToken', 'passwordResetToken'] }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    log.success(`Profile data accessed for user: ${user.username || user.email || user.id}`);
    res.status(200).json({ 
      message: "Profile data retrieved successfully", 
      user 
    });
  } catch (error) {
    log.error('Error retrieving profile', error);
    res.status(500).json({ message: 'Error retrieving profile data' });
  }
});

// Import routes - with error handling and lazy loading
log.section('Routes Loading');
const loadRoutes = () => {
  log.info('Loading route modules...');
  
  const routes = {};
  const routesList = [
    { name: 'analyticsRoutes', path: './src/routes/admin/analyticsRoutes' },
    { name: 'moderationRoutes', path: './src/routes/admin/moderationRoutes' },
    { name: 'adminRoutes', path: './src/routes/admin/adminRoutes' },
    { name: 'adminUserRoutes', path: './src/routes/admin/userRoutes' },
    { name: 'userRoutes', path: './src/routes/userRoutes' },
    { name: 'authRoutes', path: './src/routes/authRoutes' },
    { name: 'bookingRoutes', path: './src/routes/bookingRoutes' },
    { name: 'deviceRoutes', path: './src/routes/deviceRoutes' },
    { name: 'invoiceRoutes', path: './src/routes/invoiceRoutes' },
    { name: 'locationRoutes', path: './src/routes/locationRoutes' },
    { name: 'messageRoutes', path: './src/routes/messageRoutes' },
    { name: 'notificationRoutes', path: './src/routes/notificationRoutes' },
    { name: 'paymentRoutes', path: './src/routes/paymentRoutes' },
    { name: 'payoutRoutes', path: './src/routes/payoutRoutes' },
    { name: 'reviewRoutes', path: './src/routes/reviewRoutes' },
    { name: 'serviceRoutes', path: './src/routes/serviceRoutes' },
    { name: 'servicecategoryRoutes', path: './src/routes/servicecategoryRoutes' },
    { name: 'serviceproviderRoutes', path: './src/routes/serviceproviderRoutes' },
    { name: 'tableRoutes', path: './src/routes/tableRoutes' },
  ];

  for (const route of routesList) {
    try {
      routes[route.name] = require(route.path);
      log.success(`Loaded ${route.name}`);
    } catch (error) {
      // Don't crash the server if a route fails to load
      log.error(`Failed to load ${route.name}`, error);
      // Provide an empty router as fallback
      routes[route.name] = express.Router();
    }
  }

  return routes;
};

const routes = loadRoutes();

// Apply Routes safely
// Apply Routes safely
log.section('Routes Application');
const safelyApplyRoutes = () => {
  log.info('Applying routes to Express app...');
  
  // Wrap middleware in error handlers to prevent crashes
  const safeAuthenticateToken = (req, res, next) => {
    try {
      authenticateToken(req, res, next);
    } catch (error) {
      log.error('Authentication middleware error', error);
      res.status(500).json({ message: 'Authentication system error' });
    }
  };
  
  const safeAuthorize = (role) => (req, res, next) => {
    try {
      authorize(role)(req, res, next);
    } catch (error) {
      log.error('Authorization middleware error', error);
      res.status(500).json({ message: 'Authorization system error' });
    }
  };
  
  // Apply routes with safe middleware
  try {
    // ============================================
    // ADMIN ROUTES - MOUNT FIRST WITHOUT GLOBAL AUTH
    // ============================================
    if (routes.adminRoutes) {
      console.log('🔧 Mounting admin routes at /api/admin');
      app.use('/api/admin', routes.adminRoutes);
      log.success('Admin routes mounted WITHOUT global auth');
    }

    // Add moderation routes here WITHOUT global auth
    if (routes.moderationRoutes) {
      console.log('🔧 Mounting moderation routes at /api/admin/moderation');
      app.use('/api/admin/moderation', routes.moderationRoutes);
      log.success('Moderation routes mounted WITHOUT global auth');
    }

    // Add analytics routes here WITHOUT global auth
    if (routes.analyticsRoutes) {
      console.log('🔧 Mounting analytics routes at /api/admin/analytics');
      app.use('/api/admin/analytics', routes.analyticsRoutes);
      log.success('Analytics routes mounted WITHOUT global auth');
    }
    
    
    // ============================================
    // PUBLIC ROUTES (No authentication needed)
    // ============================================
    if (routes.authRoutes) {
      app.use('/api/auth', routes.authRoutes);
      log.success('Auth routes mounted');
    }
    if (routes.locationRoutes) {
      app.use('/api/location', routes.locationRoutes);
      log.success('Location routes mounted');
    }
    if (routes.reviewRoutes) {
      app.use('/api/reviews', routes.reviewRoutes);
      log.success('Review routes mounted');
    }
    if (routes.serviceRoutes) {
      app.use('/api/services', routes.serviceRoutes);
      log.success('Service routes mounted');
    }
    if (routes.servicecategoryRoutes) {
      app.use('/api/categories', routes.servicecategoryRoutes);
      log.success('Service category routes mounted');
    }
    if (routes.serviceproviderRoutes) {
      app.use('/api', routes.serviceproviderRoutes);
      log.success('Service provider routes mounted');
    }
    if (routes.tableRoutes) {
      app.use('/api/tables', routes.tableRoutes);
      log.success('Table routes mounted');
    }
    
    // ============================================
    // PROTECTED ROUTES (Authentication required)
    // ============================================
    if (routes.userRoutes) {
      app.use('/api/users', safeAuthenticateToken, safeAuthorize('user'), routes.userRoutes);
      log.success('User routes mounted');
    }
    if (routes.bookingRoutes) {
      app.use('/api/booking', safeAuthenticateToken, routes.bookingRoutes);
      log.success('Booking routes mounted');
    }
    if (routes.deviceRoutes) {
      app.use('/api/devices', safeAuthenticateToken, routes.deviceRoutes);
      log.success('Device routes mounted');
    }
    if (routes.invoiceRoutes) {
      app.use('/api/invoices', safeAuthenticateToken, routes.invoiceRoutes);
      log.success('Invoice routes mounted');
    }
    if (routes.messageRoutes) {
      app.use('/api/messages', safeAuthenticateToken, routes.messageRoutes);
      log.success('Message routes mounted');
    }
    if (routes.notificationRoutes) {
      app.use('/api/notifications', safeAuthenticateToken, routes.notificationRoutes);
      log.success('Notification routes mounted');
    }
    if (routes.paymentRoutes) {
      app.use('/api/payments', safeAuthenticateToken, routes.paymentRoutes);
      log.success('Payment routes mounted');
    }
    if (routes.payoutRoutes) {
      app.use('/api/payouts', safeAuthenticateToken, safeAuthorize(['provider', 'admin']), routes.payoutRoutes);
      log.success('Payout routes mounted');
    }
    
  } catch (error) {
    log.error('Error applying routes', error);
    // Don't crash if route application fails
  }
  
  // Search route with safe loading
  try {
    const searchRoutes = require('./src/routes/api/search');
    app.use('/api/search', searchRoutes);
    log.success('Search route loaded');
  } catch (error) {
    log.error('Failed to load search route', error);
    // Create empty router as fallback
    app.use('/api/search', express.Router());
  }
  
  log.success('Routes applied successfully');
};

safelyApplyRoutes();

// Enhanced route debugging
console.log('\n=== ADMIN ROUTE DEBUGGING ===');
console.log('Looking for admin routes...');

// Check if admin routes are properly mounted
const adminRoutes = app._router.stack.find(layer => {
  if (layer.regexp && layer.regexp.source.includes('admin')) {
    return true;
  }
  return false;
});

if (adminRoutes) {
  console.log('✅ Admin routes found in stack');
  console.log('📍 Admin route pattern:', adminRoutes.regexp.source);
  
  if (adminRoutes.handle && adminRoutes.handle.stack) {
    console.log('📋 Admin sub-routes:');
    adminRoutes.handle.stack.forEach((layer, index) => {
      if (layer.route) {
        const method = layer.route.stack[0].method.toUpperCase();
        const path = layer.route.path;
        console.log(`   ${index + 1}. ${method} /api/admin${path}`);
      }
    });
  }
} else {
  console.log('❌ Admin routes NOT found in stack');
}

console.log('\n=== ALL ROUTES DEBUG ===');
app._router.stack.forEach(function(r, index){
  if (r.route && r.route.path){
    console.log(`${index + 1}. ${r.route.stack[0].method.toUpperCase()} ${r.route.path}`);
  } else if (r.name === 'router' && r.regexp) {
    const routePath = r.regexp.source
      .replace(/\\\//g, '/')
      .replace(/\^/g, '')
      .replace(/\$/g, '')
      .replace(/\?\(\?\=/g, '')
      .replace(/\\\//g, '/')
      .replace(/\$\)/g, '')
      .replace(/\?\(\?\:/g, '')
      .replace(/\\\//g, '/')
      .replace(/\(\?\=\\\//g, '')
      .replace(/\|\\\$\)/g, '')
      .replace(/\(\?\:\\\//g, '')
      .replace(/\(\?\:\$\)\?\$\)/g, '');
    
    console.log(`${index + 1}. ROUTER: ${routePath}`);
  }
});
console.log('========================\n');

// Add just after the route registration
console.log('Available routes:');
app._router.stack.forEach(function(r){
  if (r.route && r.route.path){
    console.log(r.route.stack[0].method.toUpperCase() + ' ' + r.route.path);
  } else if (r.name === 'router') {
    r.handle.stack.forEach(function(layer) {
      if (layer.route) {
        console.log('  ' + layer.route.stack[0].method.toUpperCase() + ' ' + layer.route.path);
      }
    });
  }
});

// Health check endpoint for monitoring
app.get("/health", (req, res) => {
  try {
    // Check database connection
    const dbStatus = sequelize && sequelize.authenticate ? "checking" : "unknown";
    
    // Check if we have a connection to the database
    if (dbStatus === "checking") {
      sequelize.authenticate()
        .then(() => {
          log.info('Database connection verified via health check');
        })
        .catch(err => {
          log.error('Database connection failed in health check', err);
        });
    }
    
    res.status(200).json({
      status: "UP",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      database: dbStatus,
      uptime: Math.floor(process.uptime()) + " seconds"
    });
  } catch (error) {
    log.error('Health check error', error);
    res.status(500).json({ 
      status: "ERROR",
      message: "Health check failed",
      timestamp: new Date().toISOString()
    });
  }
});

// Simple geocoding endpoint (for demonstration)
log.section('Utility Endpoints');

app.post("/api/geocode", async (req, res) => {
  const { address } = req.body;
  
  if (!address) {
    return res.status(400).json({ message: "Address is required" });
  }
  
  try {
    // For a university project, use mock coordinates
    // In a real app, you would use Google Maps API or another geocoding service
    const mockCoordinates = {
      lat: 51.5074 + (Math.random() - 0.5) * 0.1, // London coordinates with slight randomization
      lng: -0.1278 + (Math.random() - 0.5) * 0.1
    };
    
    log.info(`Mock geocoding for address: ${address}`);
    res.status(200).json({
      address,
      coordinates: mockCoordinates
    });
  } catch (error) {
    log.error('Geocoding error', error);
    res.status(500).json({ message: 'Error geocoding address' });
  }
});

// Test Route (for verifying if the server is running)
app.get("/", async (req, res) => {
  log.info('Test route accessed');
  try {
    if (!sequelize) {
      throw new Error('Sequelize not initialized');
    }
    
    // Add a timeout to prevent hanging
    const queryPromise = sequelize.query("SELECT NOW()");
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timed out')), 5000)
    );
    
    const result = await Promise.race([queryPromise, timeoutPromise]);
    log.success('Database test successful');
    res.json({ 
      message: "Local Services Directory API is running!", 
      time: result[0][0],
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    log.error('Database test failed', error);
    res.status(500).json({ 
      error: "Database connection failed", 
      details: error.message 
    });
  }
});

// Database seeding endpoint (for university project)
app.post("/api/seed-database", async (req, res) => {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ message: 'Database seeding is only allowed in development mode' });
  }
  
  try {
    log.info('Starting database seeding process...');
    const { seedDatabase } = require('./src/utils/seedDatabase');
    await seedDatabase();
    log.success('Database seeded successfully');
    res.status(200).json({ message: 'Database seeded successfully' });
  } catch (error) {
    log.error('Database seeding error', error);
    res.status(500).json({ 
      message: 'Error seeding database',
      error: error.message
    });
  }
});

// Database backup endpoint
app.post("/api/backup-database", authenticateToken, authorize('admin'), async (req, res) => {
  try {
    log.info('Starting database backup process...');
    const backupScript = require('./scripts/backup');
    const result = await backupScript.runBackup();
    
    if (result.success) {
      log.success(`Database backup created: ${result.path}`);
      res.status(200).json({ 
        message: 'Database backup created successfully',
        path: result.path,
        duration: result.duration
      });
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    log.error('Database backup error', error);
    res.status(500).json({ 
      message: 'Error creating database backup',
      error: error.message
    });
  }
});

// System information endpoint for monitoring
app.get("/api/system-info", authenticateToken, authorize('admin'), (req, res) => {
  const os = require('os');
  
  // Get system information
  const systemInfo = {
    hostname: os.hostname(),
    platform: os.platform(),
    architecture: os.arch(),
    cpus: os.cpus().length,
    totalMemory: Math.round(os.totalmem() / (1024 * 1024)) + ' MB',
    freeMemory: Math.round(os.freemem() / (1024 * 1024)) + ' MB',
    uptime: Math.round(os.uptime() / 60 / 60) + ' hours',
    loadAvg: os.loadavg(),
    nodeVersion: process.version,
    processUptime: Math.round(process.uptime() / 60 / 60) + ' hours'
  };
  
  log.info('System information requested');
  res.status(200).json(systemInfo);
});

// Fallback route for SPA frontend (when you add the frontend)
app.get('*', (req, res) => {
  // Check if the request is for an API route
  if (req.url.startsWith('/api/')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  
  // For now, just return a message
  // Later, this will serve your frontend app
  res.send(`
    <html>
      <head>
        <title>Local Services Directory</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f7f9fc;
          }
          .container {
            text-align: center;
            padding: 2rem;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 600px;
          }
          h1 {
            color: #4285F4;
          }
          .links {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-top: 1.5rem;
          }
          .link {
            display: inline-block;
            padding: 0.5rem 1rem;
            background-color: #4285F4;
            color: white;
            text-decoration: none;
            border-radius: 4px;
          }
          .link.secondary {
            background-color: #34A853;
          }
          .link.monitoring {
            background-color: #EA4335;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Local Services Directory</h1>
          <p>Backend server is running. Frontend will be served from this location when it's ready.</p>
          <div class="links">
            <a class="link" href="/api-docs">API Documentation</a>
            <a class="link secondary" href="/health">Health Check</a>
            <a class="link monitoring" href="/metrics">Metrics</a>
          </div>
        </div>
      </body>
    </html>
  `);
});

// Global error handler
app.use((err, req, res, next) => {
  log.error(`Global error handler caught: ${err.message}`, err);
  
  // Track error in Prometheus metrics
  try {
    const errorCounter = new promClient.Counter({
      name: 'error_total',
      help: 'Count of errors',
      labelNames: ['type', 'path']
    });
    register.registerMetric(errorCounter);
    errorCounter.labels(err.name || 'UnknownError', req.path).inc();
  } catch (metricError) {
    // Ignore metric registration errors (might happen if counter already exists)
  }
  
  // Log to logger system - using try/catch for safety
  try {
    if (logger && typeof logger.error === 'function') {
      logger.error(`Error: ${err.message} | Stack: ${err.stack}`);
    } else {
      console.error(`Error: ${err.message} | Stack: ${err.stack}`);
    }
  } catch (logError) {
    console.error('Error while logging error:', logError);
    console.error(`Original error: ${err.message} | Stack: ${err.stack}`);
  }

  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

// Database connection and server start
log.section('Server Startup');
async function startServer() {
  log.info('Starting server function...');
  try {
    // Test database connection
    log.info('Testing database connection...');
    if (typeof testConnection !== 'function') {
      log.warning('testConnection is not a function, skipping this step');
    } else {
      try {
        await testConnection();
        log.success('Database connection test successful');
      } catch (testError) {
        log.error('Database connection test failed', testError);
        // Continue startup process despite connection failure
        log.warning('Continuing server startup despite database connection failure');
      }
    }

    // Sync Sequelize models - WITH IMPROVED ERROR HANDLING
    log.info('Syncing Sequelize models...');
    if (!sequelize) {
      log.error('Sequelize not initialized, skipping model sync');
    } else {
      // Create a sync timeout to prevent hanging
      const syncPromise = sequelize.sync({ alter: false });
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Sync operation timed out after 15 seconds')), 15000);
      });
      
      try {
        // Race between sync and timeout
        await Promise.race([syncPromise, timeoutPromise]);
        log.success('Database connected and synced successfully');
      } catch (syncError) {
        log.warning('Database sync failed or timed out:', syncError.message);
        log.warning('Server will start anyway, but some functionality may be limited');
      }
    }

    // Create directories for backups if they don't exist
    const backupsDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
      log.success(`Created backups directory at ${backupsDir}`);
    }

    // Start server even if sync failed
    log.info('Starting Express server...');
    const server = app.listen(PORT, () => {
      log.highlight(`Server running on port ${PORT}`);
      log.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      log.info(`API Documentation: http://localhost:${PORT}/api-docs`);
      log.info(`Health Check: http://localhost:${PORT}/health`);
      log.info(`Metrics: http://localhost:${PORT}/metrics`);
      log.success('Server startup complete!');
    });
    
    // Store server in global for graceful shutdown from uncaught exceptions
    global.server = server;
    
    // Set a keep-alive interval for the database connections
    const dbKeepAliveInterval = setInterval(async () => {
      if (sequelize) {
        try {
          await sequelize.query('SELECT 1');
          log.info('Database keep-alive ping successful');
        } catch (err) {
          log.error('Database keep-alive ping failed', err);
        }
      }
    }, 60000); // Every minute

    // Graceful shutdown handling
    const gracefulShutdown = (signal) => {
      log.warning(`Received ${signal}. Starting graceful shutdown...`);
      
      // Clear intervals
      clearInterval(pgPingInterval);
      clearInterval(dbKeepAliveInterval);
      
      // Close the HTTP server
      server.close(() => {
        log.info('HTTP server closed.');
        
        // Close database connections
        if (sequelize) {
          sequelize.close().then(() => {
            log.info('Sequelize connections closed.');
            
            // Close PG client if it exists
            if (pgClient) {
              pgClient.end().then(() => {
                log.info('PostgreSQL client closed.');
                log.success('Graceful shutdown completed.');
                process.exit(0);
              }).catch(err => {
                log.error('Error closing PostgreSQL client:', err);
                process.exit(1);
              });
            } else {
              log.success('Graceful shutdown completed.');
              process.exit(0);
            }
          }).catch(err => {
            log.error('Error closing Sequelize connections:', err);
            process.exit(1);
          });
        } else {
          log.success('Graceful shutdown completed.');
          process.exit(0);
        }
      });
      
      // Force shutdown after 30 seconds if graceful shutdown fails
      setTimeout(() => {
        log.error('Graceful shutdown timed out. Forcing exit.');
        process.exit(1);
      }, 30000);
    };
    
    // Register signal handlers for graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    log.error('Failed to start server', error);
    process.exit(1);
  }
}

startServer();

module.exports = app; // For testing purposes
