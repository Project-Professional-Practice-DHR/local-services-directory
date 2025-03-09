const xss = require('xss');
const { createHash } = require('crypto');

// Sanitize user input to prevent XSS attacks
exports.sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Use XSS library to sanitize HTML
  return xss(input, {
    whiteList: {}, // No HTML allowed
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script']
  });
};

// Generate secure random token
exports.generateRandomToken = (length = 32) => {
  return require('crypto').randomBytes(length).toString('hex');
};

// Hash sensitive data
exports.hashData = (data, salt = '') => {
  return createHash('sha256')
    .update(data + salt)
    .digest('hex');
};