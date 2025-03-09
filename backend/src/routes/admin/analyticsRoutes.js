const express = require('express');
const router = express.Router();
const AnalyticsController = require('../../controllers/admin/analyticsController');
const { validateRequest } = require('../../middleware/validation');
const { verifyAdmin } = require('../../middleware/auth');
const { dateRangeSchema } = require('../../validation/analyticsValidation');

// Apply admin verification middleware to all routes
router.use(verifyAdmin);

// Get user growth metrics
router.get(
  '/users/growth',
  validateRequest(dateRangeSchema),
  AnalyticsController.getUserGrowthMetrics
);

// Get service usage metrics
router.get(
  '/services/usage',
  validateRequest(dateRangeSchema),
  AnalyticsController.getServiceUsageMetrics
);

// Get financial reports
router.get(
  '/financial',
  validateRequest(dateRangeSchema),
  AnalyticsController.getFinancialMetrics
);

// Get popular services
router.get(
  '/services/popular',
  validateRequest(dateRangeSchema),
  AnalyticsController.getPopularServices
);

// Get system health metrics
router.get(
  '/system/health',
  AnalyticsController.getSystemHealth
);

module.exports = router;