const Joi = require('joi');

// Schema for validating user listing requests
exports.getUsersSchema = Joi.object({
  page: Joi.number().min(1),
  limit: Joi.number().min(1).max(100),
  name: Joi.string(),
  email: Joi.string().email(),
  status: Joi.string().valid('active', 'suspended', 'banned'),
  role: Joi.string().valid('user', 'provider', 'admin'),
  registeredAfter: Joi.date().iso(),
  registeredBefore: Joi.date().iso(),
  sortBy: Joi.string().valid('name', 'email', 'createdAt', 'status'),
  sortOrder: Joi.string().valid('asc', 'desc')
});

// Schema for validating user status updates
exports.updateUserStatusSchema = Joi.object({
  status: Joi.string().valid('active', 'suspended', 'banned').required(),
  reason: Joi.string().min(3).max(500).required()
});

// Schema for validating provider verification
exports.verifyProviderSchema = Joi.object({
  verificationStatus: Joi.string().valid('pending', 'verified', 'rejected').required(),
  notes: Joi.string().max(1000).required()
});