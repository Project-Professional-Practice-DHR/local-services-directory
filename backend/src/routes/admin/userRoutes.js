const express = require('express');
const router = express.Router();
const UserController = require('../../controllers/admin/userController');
const { validateRequest } = require('../../middleware/validation');
const { verifyToken, authorize } = require('../../middleware/auth');
const { getUsersSchema, updateUserStatusSchema, verifyProviderSchema } = require('../../validation/adminValidation');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin user management endpoints
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get users
 *     description: Get a list of users with various filters
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [customer, provider, admin]
 *         description: Filter by user role
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, suspended, banned]
 *         description: Filter by account status
 *       - in: query
 *         name: verified
 *         schema:
 *           type: boolean
 *         description: Filter by verification status
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Created from date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Created to date
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, email, firstName, lastName]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
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
 *         description: List of users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 *       500:
 *         description: Server error
 */
router.get(
  '/',
  verifyToken,
  authorize(['admin']),
  validateRequest(getUsersSchema),
  UserController.getUsers
);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user details
 *     description: Get detailed information about a specific user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get(
  '/:id',
  verifyToken,
  authorize(['admin']),
  UserController.getUserById
);

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   put:
 *     summary: Update user status
 *     description: Suspend, ban, or reactivate a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, suspended, banned]
 *                 description: New account status
 *               reason:
 *                 type: string
 *                 description: Reason for status change (required for suspend/ban)
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:id/status',
  verifyToken,
  authorize(['admin']),
  validateRequest(updateUserStatusSchema),
  UserController.updateUserStatus
);

/**
 * @swagger
 * /api/admin/providers/{id}/verify:
 *   put:
 *     summary: Verify provider
 *     description: Verify a service provider after reviewing their credentials
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Provider ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - verified
 *             properties:
 *               verified:
 *                 type: boolean
 *                 description: Verification status
 *               notes:
 *                 type: string
 *                 description: Administrative notes about verification
 *     responses:
 *       200:
 *         description: Provider verification status updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: Provider not found
 *       500:
 *         description: Server error
 */
router.put(
  '/providers/:id/verify',
  verifyToken,
  authorize(['admin']),
  validateRequest(verifyProviderSchema),
  UserController.verifyProvider
);

module.exports = router;