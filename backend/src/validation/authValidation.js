const Joi = require('joi');

// Register validation schema
const registerSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.base': 'Username must be a string',
      'string.empty': 'Username is required',
      'string.min': 'Username must be at least {#limit} characters long',
      'string.max': 'Username cannot be longer than {#limit} characters',
      'any.required': 'Username is required'
    }),
    
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.base': 'Email must be a string',
      'string.empty': 'Email is required',
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is required'
    }),
    
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])'))
    .required()
    .messages({
      'string.base': 'Password must be a string',
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least {#limit} characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),
    
  firstName: Joi.string()
    .required()
    .messages({
      'string.base': 'First name must be a string',
      'string.empty': 'First name is required',
      'any.required': 'First name is required'
    }),
    
  lastName: Joi.string()
    .required()
    .messages({
      'string.base': 'Last name must be a string',
      'string.empty': 'Last name is required',
      'any.required': 'Last name is required'
    }),
    
    phoneNumber: Joi.string()
    .pattern(new RegExp('^\\+?[0-9\\s()\\-]{10,20}$'))
    .allow('')
    .optional()
    .messages({
      'string.pattern.base': 'Phone number must be a valid format (10-20 characters, can include +, spaces, (), and -)',
      'string.base': 'Phone number must be a string'
    }),
    
  role: Joi.string()
    .valid('customer', 'provider', 'admin')
    .required()
    .messages({
      'string.base': 'Role must be a string',
      'string.empty': 'Role is required',
      'any.only': 'Role must be either customer, provider, or admin',
      'any.required': 'Role is required'
    })
});

// Login validation schema
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.base': 'Email must be a string',
      'string.empty': 'Email is required',
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is required'
    }),

  password: Joi.string()
    .required()
    .messages({
      'string.base': 'Password must be a string',
      'string.empty': 'Password is required',
      'any.required': 'Password is required'
    })
});

// Refresh token validation schema
const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'string.base': 'Refresh token must be a string',
      'string.empty': 'Refresh token is required',
      'any.required': 'Refresh token is required'
    })
});

// Forgot password validation schema
const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.base': 'Email must be a string',
      'string.empty': 'Email is required',
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is required'
    })
});

// Reset password validation schema
const resetPasswordSchema = Joi.object({
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])'))
    .required()
    .messages({
      'string.base': 'Password must be a string',
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least {#limit} characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),
  
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'string.base': 'Confirm password must be a string',
      'string.empty': 'Confirm password is required',
      'any.only': 'Passwords do not match',
      'any.required': 'Confirm password is required'
    })
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema
};