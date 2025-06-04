const express = require('express');
const router = express.Router();
const AnalyticsController = require('../../controllers/admin/analyticsController');
const { validateRequest } = require('../../middleware/validation');
const { verifyToken, authorize } = require('../../middleware/auth');
const { dateRangeSchema } = require('../../validation/analyticsValidation');

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Admin analytics endpoints
 */

/**
 * @swagger
 * /api/admin/analytics/users/growth:
 *   get:
 *     summary: Get user growth metrics
 *     description: Get metrics about user growth over a period
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Start date for metrics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: End date for metrics
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: day
 *         description: Interval grouping
 *     responses:
 *       200:
 *         description: User growth metrics
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 *       500:
 *         description: Server error
 */
router.get(
  '/users/growth',
  verifyToken,
  authorize(['admin']),
  validateRequest(dateRangeSchema),
  AnalyticsController.getUserGrowthMetrics
);

/**
 * @swagger
 * /api/admin/analytics/services/usage:
 *   get:
 *     summary: Get service usage metrics
 *     description: Get metrics about service usage over a period
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Start date for metrics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: End date for metrics
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: day
 *         description: Interval grouping
 *     responses:
 *       200:
 *         description: Service usage metrics
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 *       500:
 *         description: Server error
 */
router.get(
  '/services/usage',
  verifyToken,
  authorize(['admin']),
  validateRequest(dateRangeSchema),
  AnalyticsController.getServiceUsageMetrics
);

/**
 * @swagger
 * /api/admin/analytics/financial:
 *   get:
 *     summary: Get financial metrics
 *     description: Get financial metrics over a period
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Start date for metrics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: End date for metrics
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: day
 *         description: Interval grouping
 *     responses:
 *       200:
 *         description: Financial metrics
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 *       500:
 *         description: Server error
 */
router.get(
  '/financial',
  verifyToken,
  authorize(['admin']),
  validateRequest(dateRangeSchema),
  AnalyticsController.getFinancialMetrics
);

/**
 * @swagger
 * /api/admin/analytics/services/popular:
 *   get:
 *     summary: Get popular services
 *     description: Get most popular services over a period
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Start date for metrics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: End date for metrics
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of services to return
 *     responses:
 *       200:
 *         description: Popular services
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 *       500:
 *         description: Server error
 */
router.get(
  '/services/popular',
  verifyToken,
  authorize(['admin']),
  validateRequest(dateRangeSchema),
  AnalyticsController.getPopularServices
);

/**
 * @swagger
 * /api/admin/analytics/system/health:
 *   get:
 *     summary: Get system health metrics
 *     description: Get system performance and health metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System health metrics
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 *       500:
 *         description: Server error
 */
router.get(
  '/system/health',
  verifyToken,
  authorize(['admin']),
  AnalyticsController.getSystemHealth
);

module.exports = router;