const express = require('express');
const router = express.Router();
const ModerationController = require('../../controllers/admin/moderationController');
const { validateRequest } = require('../../middleware/validation');
const { verifyToken, authorize } = require('../../middleware/auth');
const { 
  flaggedContentSchema, 
  moderationActionSchema 
} = require('../../validation/moderationValidation');

/**
 * @swagger
 * tags:
 *   name: Moderation
 *   description: Admin moderation endpoints
 */

/**
 * @swagger
 * /api/admin/moderation/flagged:
 *   get:
 *     summary: Get flagged content
 *     description: Get all flagged content with optional filters
 *     tags: [Moderation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: contentType
 *         schema:
 *           type: string
 *           enum: [review, service, profile, message]
 *         description: Type of content to filter by
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Moderation status to filter by
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of flagged content
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 *       500:
 *         description: Server error
 */
router.get(
  '/flagged',
  verifyToken,
  authorize(['admin']),
  validateRequest(flaggedContentSchema),
  ModerationController.getFlaggedContent
);

/**
 * @swagger
 * /api/admin/moderation/flagged/{id}/action:
 *   put:
 *     summary: Take moderation action
 *     description: Approve or reject flagged content
 *     tags: [Moderation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Flagged content ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *                 description: Moderation action
 *               reason:
 *                 type: string
 *                 description: Reason for the action (required for reject)
 *     responses:
 *       200:
 *         description: Moderation action successful
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: Flagged content not found
 *       500:
 *         description: Server error
 */
router.put(
  '/flagged/:id/action',
  verifyToken,
  authorize(['admin']),
  validateRequest(moderationActionSchema),
  ModerationController.moderateContent
);

/**
 * @swagger
 * /api/admin/moderation/stats:
 *   get:
 *     summary: Get moderation statistics
 *     description: Get statistics about moderation activity
 *     tags: [Moderation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Moderation statistics
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 *       500:
 *         description: Server error
 */
router.get(
  '/stats',
  verifyToken,
  authorize(['admin']),
  ModerationController.getModerationStats
);

module.exports = router;