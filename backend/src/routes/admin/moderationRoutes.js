const express = require('express');
const router = express.Router();
const ModerationController = require('../../controllers/admin/moderationController');
const { validateRequest } = require('../../middleware/validation');
const { verifyAdmin } = require('../../middleware/auth');
const { 
  flaggedContentSchema, 
  moderationActionSchema 
} = require('../../validation/moderationValidation');

// Apply admin verification middleware to all routes
router.use(verifyAdmin);

// Get flagged content with optional filters
router.get(
  '/flagged',
  validateRequest(flaggedContentSchema),
  ModerationController.getFlaggedContent
);

// Take action on flagged content
router.put(
  '/flagged/:id/action',
  validateRequest(moderationActionSchema),
  ModerationController.moderateContent
);

// Get moderation statistics
router.get(
  '/stats',
  ModerationController.getModerationStats
);

module.exports = router;