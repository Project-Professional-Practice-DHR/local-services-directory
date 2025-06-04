const Joi = require('joi');

// Schema for validating flagged content list requests
exports.flaggedContentSchema = Joi.object({
  page: Joi.number().min(1),
  limit: Joi.number().min(1).max(100),
  status: Joi.string().valid('pending', 'approved', 'removed'),
  content_type: Joi.string().valid('review', 'service', 'user', 'message'),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical'),
  sortBy: Joi.string().valid('createdAt', 'severity', 'reportCount'),
  sortOrder: Joi.string().valid('asc', 'desc')
});

// Schema for validating moderation actions
exports.moderationActionSchema = Joi.object({
  action: Joi.string().valid('approve', 'remove').required(),
  reason: Joi.string().required().min(3).max(500),
  notifyUser: Joi.boolean().default(true)
});