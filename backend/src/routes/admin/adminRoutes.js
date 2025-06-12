const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/admin/adminController');
const { validateRequest } = require('../../middleware/validation');
const { verifyToken, authorize } = require('../../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Admin - Authentication
 *   description: Admin authentication operations
 */

// ==========================================
// PUBLIC ROUTES (No authentication required)
// ==========================================

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Admin login
 *     description: Authenticate admin user and return JWT token
 *     tags: [Admin - Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Admin username (email)
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 description: Admin password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Bad request - Missing credentials
 *       401:
 *         description: Unauthorized - Invalid credentials
 *       500:
 *         description: Server error
 */
router.post(
  '/login',
  adminController.login
);

// ==========================================
// PROTECTED ROUTES (Authentication required)
// ==========================================

// Apply authentication middleware to all routes below this point
router.use(verifyToken);
router.use(authorize('admin'));

// Dashboard route
router.get('/dashboard', adminController.getDashboardStats);

// User management routes
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.patch('/users/:id/status', adminController.toggleUserStatus);
router.patch('/users/:id/verify', adminController.toggleProviderVerification);
router.post('/users/:id/reset-password', adminController.resetUserPassword);

// Activity logs
router.get('/activity-logs', adminController.getActivityLogs);

module.exports = router;