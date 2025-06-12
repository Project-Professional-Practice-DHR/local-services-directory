const Joi = require('joi');

// Fixed schema - changed content_type to contentType to match your API
exports.flaggedContentSchema = Joi.object({
  page: Joi.number().min(1),
  limit: Joi.number().min(1).max(100),
  status: Joi.string().valid('pending', 'approved', 'removed'),
  contentType: Joi.string().valid('review', 'service', 'user', 'message'), // Changed from content_type
  severity: Joi.string().valid('low', 'medium', 'high', 'critical'),
  sortBy: Joi.string().valid('createdAt', 'severity', 'reportCount'),
  sortOrder: Joi.string().valid('asc', 'desc')
});

// This one looks fine
exports.moderationActionSchema = Joi.object({
  action: Joi.string().valid('approve', 'remove').required(),
  reason: Joi.string().required().min(3).max(500),
  notifyUser: Joi.boolean().default(true)
});