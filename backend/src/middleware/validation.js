const { sanitizeInput } = require('../utils/security');

// Middleware for request validation using Joi schemas
exports.validateRequest = (schema) => {
  return (req, res, next) => {
    // Determine which part of the request to validate
    const dataToValidate = {
      ...req.body,
      ...req.query,
      ...req.params
    };
    
    const { error, value } = schema.validate(dataToValidate, { 
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errorMessages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        message: 'Validation error',
        errors: errorMessages
      });
    }
    
    // Sanitize validated inputs
    for (const key in value) {
      if (typeof value[key] === 'string') {
        value[key] = sanitizeInput(value[key]);
      }
    }
    
    // Update request with validated and sanitized data
    if (Object.keys(req.body).length > 0) {
      req.body = { ...req.body, ...value };
    }
    
    if (Object.keys(req.query).length > 0) {
      req.query = { ...req.query, ...value };
    }
    
    next();
  };
};