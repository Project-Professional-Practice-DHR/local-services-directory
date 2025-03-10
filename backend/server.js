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
const { sequelize } = require("./config/database");
const { testConnection, syncDatabase } = require('./config/app.config').database;
const { securityHeaders, enableCORS, authLimiter, generalLimiter, sanitizeInputs } = require('./src/middleware/security.middleware');
const logger = require('./src/utils/logger'); // Logging utility

const app = express();
const PORT = process.env.PORT || 5001;

// Multer configuration for storing files in memory
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage: storage }); // Initialize multer with memory storage

// Set up PostgreSQL client for Neon.tech
const client = new Client({
  connectionString: process.env.DATABASE_URL,  // The database URL from your .env file
});
client.connect();

// Import the routes
const analyticsRoutes = require('./src/routes/admin/analyticsRoutes');
const moderationRoutes = require('./src/routes/admin/moderationRoutes');
const userRoutes = require('./src/routes/admin/userRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const deviceRoutes = require('./src/routes/deviceRoutes');
const invoiceRoutes = require('./src/routes/invoiceRoutes');
const locationRoutes = require('./src/routes/locationRoutes');
const messageRoutes = require('./src/routes/messageRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const payoutRoutes = require('./src/routes/payoutRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const serviceRoutes = require('./src/routes/serviceRoutes');

// Middleware
app.use(securityHeaders); // Apply security headers
app.use(enableCORS); // CORS support
app.use(morgan("dev")); // Request logging
app.use(express.json()); // JSON body parser
app.use(sanitizeInputs); // Sanitize inputs

// Apply rate limiters
app.use('/api/auth', authLimiter); // Stricter rate limit for authentication
app.use(generalLimiter); // General rate limiter for all routes

// Import the User model
const { User } = require('./src/models/User');


// Register Route
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user in the database
    const user = await User.create({
      username,
      password: hashedPassword,
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    res.status(500).json({ message: "Error registering user" });
  }
});

// Login Route - Generate JWT Token
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find user by username
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Compare entered password with stored password hash
    const isMatch = await bcrypt.compare(password, user.password_hash); // changed from password to password_hash
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { username: user.username },  // Ensure this is consistent with the payload
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: "Error logging in" });
  }
});

// File upload route
app.post('/upload', upload.single('file'), async (req, res) => {
  const { filename, mimetype, buffer } = req.file;  // File details
  const fileData = buffer;  // Binary data of the file

  try {
    // Insert file data into the PostgreSQL database (Neon.tech)
    const result = await client.query(
      'INSERT INTO files (filename, filetype, data) VALUES ($1, $2, $3) RETURNING id',
      [filename, mimetype, fileData]
    );
    
    // Return a response with the file ID
    res.status(200).json({ message: 'File uploaded successfully!', fileId: result.rows[0].id });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Error uploading file' });
  }
});

// Protected Route (requires JWT token)
app.get("/profile", (req, res) => {
  const token = req.header("Authorization") && req.header("Authorization").split(" ")[1];

  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }

    res.status(200).json({ message: "Profile data", username: decoded.username });
  });
});

// Apply Routes
app.use('/api/admin/analytics', analyticsRoutes); // Analytics routes
app.use('/api/admin/moderation', moderationRoutes); // Moderation routes
app.use('/api/admin/users', userRoutes); // User management routes
app.use('/api/admin/booking', bookingRoutes); // Booking routes
app.use('/api/admin/devices', deviceRoutes); // Device routes
app.use('/api/admin/invoices', invoiceRoutes); // Invoice routes
app.use('/api/admin/location', locationRoutes); // Location routes
app.use('/api/admin/messages', messageRoutes); // Messages routes
app.use('/api/admin/notifications', notificationRoutes); // Notifications routes
app.use('/api/admin/payments', paymentRoutes); // Payment routes
app.use('/api/admin/payouts', payoutRoutes); // Payout routes
app.use('/api/admin/reviews', reviewRoutes); // Review routes
app.use('/api/admin/services', serviceRoutes); // Service routes
app.use('/api/search', require('./routes/api/search')); // Search routes

// Test Route (for verifying if the server is running)
app.get("/", async (req, res) => {
  try {
    const result = await sequelize.query("SELECT NOW()");
    res.json({ message: "Server running!", time: result[0][0] });
  } catch (error) {
    res.status(500).json({ error: "Database connection failed" });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message} | Stack: ${err.stack}`);

  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {},
  });
});

// Database connection and server start
async function startServer() {
  try {
    // Test database connection
    await testConnection();

    // Sync models (only in development mode)
    if (process.env.NODE_ENV === 'development') {
      await syncDatabase();
    }

    // Sync Sequelize models
    await sequelize.sync()
      .then(() => console.log('Database connected and synced'))
      .catch((err) => console.log('Error syncing database:', err));

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app; // For testing purposes