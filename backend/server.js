const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const multer = require('multer');
const { Client } = require('pg');  // PostgreSQL client
require("dotenv").config();
const path = require("path");

// Add unhandled rejection and exception handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Database setup - with error handling
let sequelize;
try {
  console.log('\x1b[32m💾 Loading database configuration...\x1b[0m');
  const dbModule = require("./config/database");
  sequelize = dbModule.sequelize;
  console.log('\x1b[32m✅ Database configuration loaded successfully\x1b[0m');
} catch (error) {
  console.error('\x1b[31m❌ Failed to load database configuration:', error, '\x1b[0m');
  process.exit(1);
}

// Load app configuration - with error handling
let testConnection, syncDatabase;
try {
  console.log('Loading app configuration...');
  const appConfig = require('./config/app.config');
  if (!appConfig.database) {
    console.error('\x1b[31m🚫 Database configuration not found in app.config\x1b[0m');
    process.exit(1);
  }
  testConnection = appConfig.database.testConnection;
  syncDatabase = appConfig.database.syncDatabase;
  console.log('\x1b[32m✅ App configuration loaded successfully\x1b[0m');
} catch (error) {
  console.error('\x1b[31m❌ Failed to load app configuration:', error, '\x1b[0m');
  process.exit(1);
}

// Load middleware - with error handling
let securityHeaders, enableCORS, authLimiter, generalLimiter, sanitizeInputs;
try {
  console.log('\x1b[34m🛡️ Loading security middleware...\x1b[0m');
  const securityMiddleware = require('./src/middleware/security.middleware');
  securityHeaders = securityMiddleware.securityHeaders;
  enableCORS = securityMiddleware.enableCORS;
  authLimiter = securityMiddleware.authLimiter;
  generalLimiter = securityMiddleware.generalLimiter;
  sanitizeInputs = securityMiddleware.sanitizeInputs;
  console.log('\x1b[32m✅ Security middleware loaded successfully\x1b[0m');
} catch (error) {
  console.error('\x1b[31m❌ Failed to load security middleware:', error, '\x1b[0m');
  process.exit(1);
}

// Load logger - with error handling
let logger;
try {
  console.log('\x1b[35m📝 Loading logger...\x1b[0m');
  logger = require('./src/utils/logger');
  console.log('\x1b[32m✅ Logger loaded successfully\x1b[0m');
} catch (error) {
  console.error('\x1b[31m❌ Failed to load logger:', error, '\x1b[0m');
  // Create a simple fallback logger
  logger = {
    error: console.error,
    info: console.log,
    warn: console.warn
  };
}

const app = express();
const PORT = process.env.PORT || 5001;

// Display environment variables status (without showing values)
console.log('\x1b[36m🔧 Environment variables check:\x1b[0m');
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '\x1b[32m✓ Set\x1b[0m' : '\x1b[31m✗ Missing\x1b[0m');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '\x1b[32m✓ Set\x1b[0m' : '\x1b[31m✗ Missing\x1b[0m');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'Not set, defaulting to development');

// Multer configuration for storing files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Set up PostgreSQL client with better error handling
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

console.log('\x1b[32m🔌 Connecting to PostgreSQL...\x1b[0m');
client.connect()
  .then(() => {
    console.log('\x1b[32m✅ PostgreSQL connection successful!\x1b[0m');
  })
  .catch((err) => {
    console.error('\x1b[31m❌ PostgreSQL connection error:', err.message, '\x1b[0m');
    // Don't exit process here, just log the error
  });

// Import routes - with error handling and lazy loading
const loadRoutes = () => {
  console.log('\x1b[37m🚚 Loading routes...\x1b[0m');
  
  const routes = {};
  const routesList = [
    { name: 'analyticsRoutes', path: './src/routes/admin/analyticsRoutes' },
    { name: 'moderationRoutes', path: './src/routes/admin/moderationRoutes' },
    { name: 'userRoutes', path: './src/routes/admin/userRoutes' },
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
      console.log(`\x1b[32m✅ Loaded ${route.name}\x1b[0m`);
    } catch (error) {
      console.error(`\x1b[31m❌ Failed to load ${route.name}:`, error.message, '\x1b[0m');
      // Continue loading other routes
    }
  }

  return routes;
};

const routes = loadRoutes();

// Load User model - with error handling
let User;
try {
  console.log('\x1b[36m👤 Loading User model...\x1b[0m');
  const userModule = require('./src/models/User');
  User = userModule.User;
  console.log('\x1b[32m✅ User model loaded successfully\x1b[0m');
} catch (error) {
  console.error('\x1b[31m❌ Failed to load User model:', error, '\x1b[0m');
  // Continue without User model, handle failures in routes
}

// Middleware
try {
  app.use(securityHeaders); // Apply security headers
  app.use(enableCORS); // CORS support
  app.use(morgan("dev")); // Request logging
  app.use(express.json()); // JSON body parser
  app.use(sanitizeInputs); // Sanitize inputs
  console.log('\x1b[32m✅ Middleware applied successfully\x1b[0m');
} catch (error) {
  console.error('\x1b[31m❌ Error applying middleware:', error, '\x1b[0m');
  process.exit(1);
}

// Apply rate limiters
try {
  app.use('/api/auth', authLimiter); // Stricter rate limit for authentication
  app.use(generalLimiter); // General rate limiter for all routes
  console.log('\x1b[32m✅ Rate limiters applied successfully\x1b[0m');
} catch (error) {
  console.error('\x1b[31m❌ Error applying rate limiters:', error, '\x1b[0m');
  // Continue without rate limiters
}

// Register Route
app.post("/register", async (req, res) => {
  console.log('\x1b[37m📝 Register request received\x1b[0m');
  const { username, password } = req.body;

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user in the database
    if (!User) {
      throw new Error('User model not available');
    }
    
    const user = await User.create({
      username,
      password: hashedPassword,
    });

    console.log('\x1b[32m✅ User registered successfully:', username, '\x1b[0m');
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(`Registration error:`, error);
    logger.error(`\x1b[31m❌ Registration error:`, error, '\x1b[0m');
    res.status(500).json({ message: "Error registering user" });
  }
});

// Login Route - Generate JWT Token
app.post("/login", async (req, res) => {
  console.log('\x1b[37m📝 Login request received\x1b[0m');
  const { username, password } = req.body;

  try {
    // Find user by username
    if (!User) {
      throw new Error('User model not available');
    }
    
    const user = await User.findOne({ where: { username } });
    if (!user) {
      console.log('Login attempt: User not found:', username);
      return res.status(400).json({ message: "User not found" });
    }

    // Compare entered password with stored password hash
    const isMatch = await bcrypt.compare(password, user.password_hash); // changed from password to password_hash
    if (!isMatch) {
      console.log('Login attempt: Invalid credentials for user:', username);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { username: user.username },  // Ensure this is consistent with the payload
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log('\x1b[32m✅ User logged in successfully:', username);
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error('\x1b[31m❌ Login error:', error.message, '\x1b[0m');
    res.status(500).json({ message: "Error logging in" });
  }
});

// File upload route
app.post('/upload', upload.single('file'), async (req, res) => {
  console.log('File upload request received');
  
  if (!req.file) {
    console.log('Upload failed: No file provided');
    return res.status(400).json({ message: 'No file provided' });
  }
  
  const { filename, mimetype, buffer } = req.file;  // File details
  const fileData = buffer;  // Binary data of the file

  try {
    // Insert file data into the PostgreSQL database (Neon.tech)
    const result = await client.query(
      'INSERT INTO files (filename, filetype, data) VALUES ($1, $2, $3) RETURNING id',
      [filename, mimetype, fileData]
    );
    
    console.log('File uploaded successfully:', filename);
    // Return a response with the file ID
    res.status(200).json({ message: 'File uploaded successfully!', fileId: result.rows[0].id });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Error uploading file' });
  }
});

// Protected Route (requires JWT token)
app.get("/profile", (req, res) => {
  console.log('Profile request received');
  const token = req.header("Authorization") && req.header("Authorization").split(" ")[1];

  if (!token) {
    console.log('Profile request: No token provided');
    return res.status(403).json({ message: "No token provided" });
  }

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('Profile request: Invalid token');
      return res.status(403).json({ message: "Invalid token" });
    }

    console.log('Profile data accessed for user:', decoded.username);
    res.status(200).json({ message: "Profile data", username: decoded.username });
  });
});

// Apply Routes safely
const safelyApplyRoutes = () => {
  console.log('\x1b[32m🚚 Applying routes...\x1b[0m');
  
  if (routes.analyticsRoutes) app.use('/api/admin/analytics', routes.analyticsRoutes);
  if (routes.moderationRoutes) app.use('/api/admin/moderation', routes.moderationRoutes);
  if (routes.userRoutes) app.use('/api/admin/users', routes.userRoutes);
  if (routes.bookingRoutes) app.use('/api/booking', routes.bookingRoutes);
  if (routes.deviceRoutes) app.use('/api/devices', routes.deviceRoutes);
  if (routes.invoiceRoutes) app.use('/api/invoices', routes.invoiceRoutes);
  if (routes.locationRoutes) app.use('/api/location', routes.locationRoutes);
  if (routes.messageRoutes) app.use('/api/messages', routes.messageRoutes);
  if (routes.notificationRoutes) app.use('/api/notifications', routes.notificationRoutes);
  if (routes.paymentRoutes) app.use('/api/payments', routes.paymentRoutes);
  if (routes.payoutRoutes) app.use('/api/payouts', routes.payoutRoutes);
  if (routes.reviewRoutes) app.use('/api/reviews', routes.reviewRoutes);
  if (routes.serviceRoutes) app.use('/api/services', routes.serviceRoutes);
  
  // Search route with safe loading
  try {
    const searchRoutes = require('./src/routes/api/search');
    app.use('/api/search', searchRoutes);
    console.log('✓ Search route loaded');
  } catch (error) {
    console.error('\x1b[31m❌ Failed to load search route: Cannot find module ', error.message, '\x1b[0m ');
  }
  
  console.log('\x1b[32m✅ Routes applied successfully\x1b[0m');
};

safelyApplyRoutes();

// Test Route (for verifying if the server is running)
app.get("/", async (req, res) => {
  console.log('Test route accessed');
  try {
    if (!sequelize) {
      throw new Error('Sequelize not initialized');
    }
    
    const result = await sequelize.query("SELECT NOW()");
    console.log('Database test successful');
    res.json({ message: "Server running!", time: result[0][0] });
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({ error: "Database connection failed", details: error.message });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(`Global error handler caught:`, err);
  logger.error(`Error: ${err.message} | Stack: ${err.stack}`);

  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {},
  });
});

// Database connection and server start
async function startServer() {
  console.log("1. \x1b[32mStarting server function...\x1b[0m ");
  try {
    // Test database connection
    console.log("2. \x1b[32mTesting database connection...\x1b[0m");
    if (typeof testConnection !== 'function') {
      throw new Error('testConnection is not a function');
    }
    
    await testConnection();
    console.log("3. \x1b[32mDatabase connection test successful\x1b[0m ");

    // Sync models (only in development mode)
    if (process.env.NODE_ENV === 'development') {
      console.log("4. \x1b[32mDevelopment mode detected, syncing database...\x1b[0m ");
      if (typeof syncDatabase !== 'function') {
        throw new Error('syncDatabase is not a function');
      }
      
      await syncDatabase();
      console.log("5. \x1b[32mDatabase sync completed\x1b[0m");
    } else {
      console.log("4. ❌ Not in development mode, skipping sync");
    }

    // Sync Sequelize models
    console.log("6. \x1b[32mSyncing Sequelize models...\x1b[0m ");
    if (!sequelize) {
      throw new Error('Sequelize not initialized');
    }
    
    await sequelize.sync()
      .then(() => console.log('7. \x1b[32mDatabase connected and synced\x1b[0m '))
      .catch((err) => {
        console.error('Error syncing database:', err);
        throw err; // Re-throw to be caught by the outer catch
      });

    // Start server
    console.log("8. \x1b[32mStarting Express server...\x1b[0m ");
    app.listen(PORT, () => {
      console.log(`\x1b[32m🚀 Server running on port ${PORT}\x1b[0m`);
      console.log(`\x1b[36m🌍 ENVIRONMENT: \x1b[33m${process.env.NODE_ENV || 'development'}\x1b[0m'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app; // For testing purposes