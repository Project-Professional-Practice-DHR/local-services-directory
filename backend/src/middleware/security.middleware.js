const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { sanitizeInput } = require('../utils/security');  // Assuming you have a sanitizeInput function

// Enable security headers
const securityHeaders = helmet();

// CORS configuration - Allow only trusted domains
const corsOptions = {
  origin: ['https://yourfrontend.com', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,  // Allow credentials (cookies, etc.)
};

// Enable CORS
const enableCORS = cors(corsOptions);

// Rate limiting for authentication routes (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                   // Only 10 login attempts per 15 minutes
  message: 'Too many login attempts. Try again later.',
});

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 100,             // Max 100 requests per minute
  message: 'Too many requests. Please slow down.',
});

// Sanitize inputs from request body, query, and params
const sanitizeInputs = (req, res, next) => {
  // Sanitize the request body, query, and params
  ['body', 'query', 'params'].forEach((key) => {
    if (req[key]) {
      Object.keys(req[key]).forEach((field) => {
        if (typeof req[key][field] === 'string') {
          req[key][field] = sanitizeInput(req[key][field]);
        }
      });
    }
  });

  // Move to the next middleware
  next();
};

module.exports = {
  securityHeaders,
  enableCORS,
  authLimiter,
  generalLimiter,
  sanitizeInputs
};