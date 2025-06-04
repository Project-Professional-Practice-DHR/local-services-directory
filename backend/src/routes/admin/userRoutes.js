const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../../middleware/auth');
const userController = require('../../controllers/admin/userController');
const { validateRequest } = require('../../middleware/validation');
const { updateProfileSchema, changePasswordSchema } = require('../../validation/adminValidation');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - firstName
 *         - lastName
 *         - role
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated id of the user
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the user
 *         firstName:
 *           type: string
 *           description: First name
 *         lastName:
 *           type: string
 *           description: Last name
 *         role:
 *           type: string
 *           enum: [customer, provider, admin]
 *           description: User role
 *         profilePicture:
 *           type: string
 *           description: URL to profile picture
 *         phone:
 *           type: string
 *           description: Phone number
 *         address:
 *           type: string
 *           description: Physical address
 *         city:
 *           type: string
 *           description: City
 *         state:
 *           type: string
 *           description: State or province
 *         zipCode:
 *           type: string
 *           description: Postal code
 *         country:
 *           type: string
 *           description: Country
 *         bio:
 *           type: string
 *           description: User biography/description
 *         status:
 *           type: string
 *           enum: [active, suspended, banned]
 *           description: Account status
 *         isVerified:
 *           type: boolean
 *           description: Email verification status
 *         isProviderVerified:
 *           type: boolean
 *           description: Provider verification status (for service providers)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the user account was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the user account was last updated
 */

// Create fallback handlers for routes not yet implemented in the controller
const getProfile = userController.getProfile || ((req, res) => {
  res.status(200).json({
    success: true,
    message: 'Placeholder: User profile functionality not yet implemented',
    user: { id: req.user.id, firstName: 'Sample', lastName: 'User' }
  });
});

const updateProfile = userController.updateProfile || ((req, res) => {
  res.status(200).json({
    success: true,
    message: 'Placeholder: Update profile functionality not yet implemented',
    user: { id: req.user.id, ...req.body }
  });
});

const changePassword = userController.changePassword || ((req, res) => {
  res.status(200).json({
    success: true,
    message: 'Placeholder: Change password functionality not yet implemented'
  });
});

const getProviders = userController.getProviders || ((req, res) => {
  res.status(200).json({
    success: true,
    message: 'Placeholder: Get providers functionality not yet implemented',
    providers: []
  });
});

const getProviderById = userController.getProviderById || ((req, res) => {
  res.status(200).json({
    success: true,
    message: `Placeholder: Get provider ${req.params.id} functionality not yet implemented`,
    provider: { id: req.params.id }
  });
});

const getCustomerById = userController.getCustomerById || ((req, res) => {
  res.status(200).json({
    success: true,
    message: `Placeholder: Get customer ${req.params.id} functionality not yet implemented`,
    customer: { id: req.params.id }
  });
});

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve the authenticated user's profile information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/profile', verifyToken, getProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     description: Update the authenticated user's profile information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               zipCode:
 *                 type: string
 *               country:
 *                 type: string
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/profile', verifyToken, validateRequest(updateProfileSchema), updateProfile);

/**
 * @swagger
 * /api/users/password:
 *   put:
 *     summary: Change password
 *     description: Change the authenticated user's password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid current password or validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/password', verifyToken, validateRequest(changePasswordSchema), changePassword);

/**
 * @swagger
 * /api/users/providers:
 *   get:
 *     summary: Get service providers
 *     description: Retrieve a list of service providers
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by service category
 *       - in: query
 *         name: verified
 *         schema:
 *           type: boolean
 *         description: Filter by verification status
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Minimum rating
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
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of service providers
 *       500:
 *         description: Server error
 */
router.get('/providers', getProviders);

/**
 * @swagger
 * /api/users/providers/{id}:
 *   get:
 *     summary: Get provider details
 *     description: Retrieve detailed information about a service provider
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Provider ID
 *     responses:
 *       200:
 *         description: Provider details
 *       404:
 *         description: Provider not found
 *       500:
 *         description: Server error
 */
router.get('/providers/:id', getProviderById);

/**
 * @swagger
 * /api/users/customers/{id}:
 *   get:
 *     summary: Get customer details
 *     description: Retrieve detailed information about a customer (requires authentication)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Provider or admin access required
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
router.get('/customers/:id', verifyToken, authorize(['provider', 'admin']), getCustomerById);

module.exports = router;