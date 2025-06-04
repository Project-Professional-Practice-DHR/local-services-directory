const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken, authorize } = require('../middleware/auth');
const { errorConverter, errorHandler } = require('../middleware/errorHandler');

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment processing endpoints
 */

/**
 * @swagger
 * /api/payments/create-intent:
 *   post:
 *     summary: Create payment intent
 *     description: Create a Stripe payment intent for a booking
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *             properties:
 *               bookingId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the booking to pay for
 *     responses:
 *       200:
 *         description: Payment intent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 clientSecret:
 *                   type: string
 *                 paymentId:
 *                   type: string
 *       400:
 *         description: Invalid request or payment already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.post('/create-intent', 
  verifyToken, 
  authorize(['customer']),
  paymentController.createPaymentIntent
);

/**
 * @swagger
 * /api/payments/confirm:
 *   post:
 *     summary: Confirm payment
 *     description: Confirm a payment after successful processing by Stripe
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentIntentId
 *             properties:
 *               paymentIntentId:
 *                 type: string
 *                 description: Stripe payment intent ID
 *     responses:
 *       200:
 *         description: Payment confirmed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
router.post('/confirm', 
  verifyToken, 
  authorize(['customer']), 
  paymentController.confirmPayment
);

/**
 * @swagger
 * /api/payments/{paymentId}:
 *   get:
 *     summary: Get payment details
 *     description: Get detailed information about a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
router.get('/:paymentId', 
  verifyToken, 
  paymentController.getPaymentDetails
);

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Stripe webhook handler
 *     description: Handle Stripe webhook events
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook signature
 *       500:
 *         description: Server error
 */
router.post('/webhook', 
  express.raw({ type: 'application/json' }), 
  paymentController.handleStripeWebhook
);

/**
 * @swagger
 * /api/payments/refund:
 *   post:
 *     summary: Process refund
 *     description: Process a refund for a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *             properties:
 *               paymentId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the payment to refund
 *               amount:
 *                 type: number
 *                 description: Amount to refund (optional, defaults to full amount)
 *               reason:
 *                 type: string
 *                 description: Reason for refund
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
router.post('/refund', 
  verifyToken, 
  authorize(['admin', 'provider']),
  paymentController.processRefund
);

/**
 * @swagger
 * /api/payments/customer-history:
 *   get:
 *     summary: Get customer payment history
 *     description: Get payment history for the authenticated customer
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer payment history
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get('/customer-history', 
  verifyToken, 
  authorize(['customer']), 
  paymentController.getCustomerPaymentHistory
);

/**
 * @swagger
 * /api/payments/provider-history:
 *   get:
 *     summary: Get provider payment history
 *     description: Get payment history for the authenticated service provider
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Provider payment history
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get('/provider-history', 
  verifyToken, 
  authorize(['provider', 'admin']),
  paymentController.getProviderPaymentHistory
);

// Apply error handling middleware at the router level
router.use(errorConverter);
router.use(errorHandler);

module.exports = router;