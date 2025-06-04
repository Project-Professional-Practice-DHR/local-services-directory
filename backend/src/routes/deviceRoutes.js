const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const { verifyToken } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Devices
 *   description: Device management endpoints
 */

/**
 * @swagger
 * /api/devices/register:
 *   post:
 *     summary: Register a device
 *     description: Register a device for push notifications
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Device push notification token
 *               deviceType:
 *                 type: string
 *                 enum: [ios, android, web]
 *                 description: Type of device
 *     responses:
 *       200:
 *         description: Device registered successfully
 *       400:
 *         description: Missing token
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/register', verifyToken, deviceController.registerDevice);

/**
 * @swagger
 * /api/devices/unregister:
 *   post:
 *     summary: Unregister a device
 *     description: Unregister a device from push notifications
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Device token to unregister
 *     responses:
 *       200:
 *         description: Device unregistered successfully
 *       400:
 *         description: Missing token
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/unregister', verifyToken, deviceController.unregisterDevice);

/**
 * @swagger
 * /api/devices/list:
 *   get:
 *     summary: List user devices
 *     description: List all devices registered for the authenticated user
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user devices
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Add this endpoint if the controller has the method
if (deviceController.listUserDevices) {
  router.get('/list', verifyToken, deviceController.listUserDevices);
}

module.exports = router;