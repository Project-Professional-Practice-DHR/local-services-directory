// File: src/utils/security.js
const xss = require('xss');
const { createHash, randomBytes } = require('crypto');

/**
 * Sanitize user input to prevent XSS attacks
 * @param {string} input - String to sanitize
 * @returns {string} - Sanitized string
 */
exports.sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Use XSS library to sanitize HTML
  return xss(input, {
    whiteList: {}, // No HTML allowed
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script']
  });
};

/**
 * Generate secure random token
 * @param {number} length - Length of the token in bytes (will be twice this in hex)
 * @returns {string} - Random hex token
 */
exports.generateRandomToken = (length = 32) => {
  return randomBytes(length).toString('hex');
};

/**
 * Hash sensitive data
 * @param {string} data - Data to hash
 * @param {string} salt - Optional salt to add to the hash
 * @returns {string} - Hashed data
 */
exports.hashData = (data, salt = '') => {
  return createHash('sha256')
    .update(data + salt)
    .digest('hex');
};

/**
 * Validate that a password meets security requirements
 * @param {string} password - Password to validate
 * @returns {object} - Object with isValid flag and message if invalid
 */
exports.validatePassword = (password) => {
  if (typeof password !== 'string') {
    return { isValid: false, message: 'Password must be a string' };
  }
  
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  // Check for number
  if (!/\d/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  // Check for special character
  if (!/[!@#$%^&*]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character' };
  }
  
  return { isValid: true };
};

/**
 * Generate a CSRF token
 * @param {string} sessionId - User's session ID to bind the token to
 * @returns {string} - CSRF token
 */
exports.generateCSRFToken = (sessionId) => {
  return exports.hashData(sessionId + exports.generateRandomToken(16));
};