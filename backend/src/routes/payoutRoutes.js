const express = require('express');
const router = express.Router();
const payoutController = require('../controllers/payoutController');
const { verifyToken, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Payouts
 *   description: Payout management endpoints
 */

/**
 * @swagger
 * /api/payouts/schedule:
 *   post:
 *     summary: Schedule payouts
 *     description: Schedule payouts for providers (admin only)
 *     tags: [Payouts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payouts scheduled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 payouts:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 *       500:
 *         description: Server error
 */
router.post('/schedule', verifyToken, authorize('admin'), payoutController.schedulePayouts);

/**
 * @swagger
 * /api/payouts/process:
 *   post:
 *     summary: Process pending payouts
 *     description: Process pending payouts (admin only)
 *     tags: [Payouts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payouts processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 results:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: array
 *                       items:
 *                         type: string
 *                     failed:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 *       500:
 *         description: Server error
 */
router.post('/process', verifyToken, authorize('admin'), payoutController.processPayouts);

/**
 * @swagger
 * /api/payouts/provider:
 *   get:
 *     summary: Get provider payouts
 *     description: Get payout history for the authenticated provider
 *     tags: [Payouts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Provider payout history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payouts:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - provider only
 *       500:
 *         description: Server error
 */
router.get('/provider', verifyToken, authorize('provider'), payoutController.getProviderPayouts);

/**
 * @swagger
 * /api/payouts/{payoutId}:
 *   get:
 *     summary: Get payout details
 *     description: Get detailed information about a specific payout
 *     tags: [Payouts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: payoutId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Payout ID
 *     responses:
 *       200:
 *         description: Payout details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Payout not found
 *       500:
 *         description: Server error
 */
// Add this endpoint if the controller has the method
if (payoutController.getPayoutDetails) {
  router.get('/:payoutId', verifyToken, payoutController.getPayoutDetails);
}

module.exports = router;