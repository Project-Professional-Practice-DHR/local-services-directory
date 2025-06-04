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
});

process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception', error);
  process.exit(1);
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

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Neon.tech
  }
});

client.connect()
  .then(() => {
    log.success('Neon.tech PostgreSQL connection successful!');
  })
  .catch((err) => {
    log.error('PostgreSQL connection error', err);
    // Don't exit process here, just log the error
  });

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
  
  // Add metrics middleware
  app.use((req, res, next) => {
    // Skip metrics endpoint to avoid circular references
    if (req.path === '/metrics') {
      return next();
    }
    
    // Track request duration
    const startTime = process.hrtime();
    
    // Capture original end method
    const originalEnd = res.end;
    
    // Override end method to capture metrics before response is sent
    res.end = function(...args) {
      // Calculate request duration
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const duration = seconds + nanoseconds / 1e9;
      
      // Record metrics
      httpRequestDurationMicroseconds
        .labels(req.method, req.path, res.statusCode)
        .observe(duration);
      
      httpRequestsTotal
        .labels(req.method, req.path, res.statusCode)
        .inc();
      
      // Call the original end method
      return originalEnd.apply(this, args);
    };
    
    next();
  });
  
  app.use(morgan("dev")); // Request logging
  app.use(express.json()); // JSON body parser
  app.use(sanitizeInputs); // Sanitize inputs
  app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploads directory
  log.success('Middleware applied successfully');
} catch (error) {
  log.error('Error applying middleware', error);
  process.exit(1);
}

// Apply rate limiters
try {
  log.info('Applying rate limiters...');
  app.use('/api/auth', authLimiter); // Stricter rate limit for authentication
  app.use(generalLimiter); // General rate limiter for all routes
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

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.sendStatus(401);
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Role-based Authorization Middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    next();
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

// Protected Route (requires JWT token)
app.get("/profile", authenticateToken, async (req, res) => {
  log.info(`Profile request received for user ${req.user.id}`);
  
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash', 'verificationToken', 'passwordResetToken'] }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    log.success(`Profile data accessed for user: ${user.username}`);
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
    { name: 'userRoutes', path: './src/routes/admin/userRoutes' },
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
    { name: 'serviceRoutes', path: './src/routes/serviceRoutes' }
  ];

  for (const route of routesList) {
    try {
      routes[route.name] = require(route.path);
      log.success(`Loaded ${route.name}`);
    } catch (error) {
      log.error(`Failed to load ${route.name}`, error);
      // Continue loading other routes
    }
  }

  return routes;
};

const routes = loadRoutes();

// Apply Routes safely
log.section('Routes Application');
const safelyApplyRoutes = () => {
  log.info('Applying routes to Express app...');
  
  if (routes.analyticsRoutes) app.use('/api/admin/analytics', authenticateToken, authorize('admin'), routes.analyticsRoutes);
  if (routes.moderationRoutes) app.use('/api/admin/moderation', authenticateToken, authorize('admin'), routes.moderationRoutes);
  if (routes.userRoutes) app.use('/api/admin/users', authenticateToken, authorize('admin'), routes.userRoutes);
  if (routes.authRoutes) app.use('/api/auth', routes.authRoutes);
  if (routes.bookingRoutes) app.use('/api/booking', authenticateToken, routes.bookingRoutes);
  if (routes.deviceRoutes) app.use('/api/devices', authenticateToken, routes.deviceRoutes);
  if (routes.invoiceRoutes) app.use('/api/invoices', authenticateToken, routes.invoiceRoutes);
  if (routes.locationRoutes) app.use('/api/location', routes.locationRoutes);
  if (routes.messageRoutes) app.use('/api/messages', authenticateToken, routes.messageRoutes);
  if (routes.notificationRoutes) app.use('/api/notifications', authenticateToken, routes.notificationRoutes);
  if (routes.paymentRoutes) app.use('/api/payments', authenticateToken, routes.paymentRoutes);
  if (routes.payoutRoutes) app.use('/api/payouts', authenticateToken, authorize('provider', 'admin'), routes.payoutRoutes);
  if (routes.reviewRoutes) app.use('/api/reviews', routes.reviewRoutes);
  if (routes.serviceRoutes) app.use('/api/services', routes.serviceRoutes);
  
  // Search route with safe loading
  try {
    const searchRoutes = require('./src/routes/api/search');
    app.use('/api/search', searchRoutes);
    log.success('Search route loaded');
  } catch (error) {
    log.error('Failed to load search route', error);
  }
  
  log.success('Routes applied successfully');
};

safelyApplyRoutes();

// Health check endpoint for monitoring
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development"
  });
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
    
    const result = await sequelize.query("SELECT NOW()");
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
  
  // Log to logger system
  logger.error(`Error: ${err.message} | Stack: ${err.stack}`);

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
      throw new Error('testConnection is not a function');
    }
    
    await testConnection();
    log.success('Database connection test successful');

    // Sync Sequelize models - WITH IMPROVED ERROR HANDLING
    log.info('Syncing Sequelize models...');
    if (!sequelize) {
      throw new Error('Sequelize not initialized');
    }
    
    // Option 1: Try running without alter mode first
    try {
      log.info('Attempting to sync without altering tables...');
      await sequelize.sync({ alter: false });
      log.success('Database connected and synced successfully');
    } catch (syncError) {
      log.warning('Basic sync failed, attempting with logging to pinpoint the issue:', syncError.message);
      
      // Option 2: If that fails, try sync with logging to diagnose the problem
      try {
        await sequelize.sync({ 
          alter: false,
          logging: (sql) => log.info(`SQL: ${sql}`) 
        });
      } catch (loggedSyncError) {
        log.error('Sync with logging failed:', loggedSyncError.message);
        
        // Option 3: As a last resort, skip model sync entirely and start the server anyway
        log.warning('Unable to sync database models. Server will start, but some functionality may be limited.');
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

    // Graceful shutdown handling
    const gracefulShutdown = (signal) => {
      log.warning(`Received ${signal}. Starting graceful shutdown...`);
      
      // Close the HTTP server
      server.close(() => {
        log.info('HTTP server closed.');
        
        // Close database connections
        sequelize.close().then(() => {
          log.info('Database connections closed.');
          log.success('Graceful shutdown completed.');
          process.exit(0);
        }).catch(err => {
          log.error('Error closing database connections:', err);
          process.exit(1);
        });
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