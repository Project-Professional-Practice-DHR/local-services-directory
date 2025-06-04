const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { verifyToken, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Invoices
 *   description: Invoice management endpoints
 */

/**
 * @swagger
 * /api/invoices/generate/{paymentId}:
 *   post:
 *     summary: Generate invoice for a payment
 *     description: Generates a PDF invoice for a specified payment
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the payment to generate invoice for
 *     responses:
 *       200:
 *         description: Invoice generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invoice generated successfully"
 *                 invoiceId:
 *                   type: string
 *                   format: uuid
 *                 invoiceNumber:
 *                   type: string
 *                 emailSent:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the payment owner or admin
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
router.post('/generate/:paymentId', verifyToken, invoiceController.generateInvoice);

/**
 * @swagger
 * /api/invoices/{paymentId}:
 *   get:
 *     summary: Get invoice by payment ID
 *     description: Get invoice details for a specific payment
 *     tags: [Invoices]
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
 *         description: Invoice details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the invoice owner or admin
 *       404:
 *         description: Invoice not found for the payment
 *       500:
 *         description: Server error
 */
router.get('/:paymentId', verifyToken, invoiceController.getInvoiceByPaymentId);

/**
 * @swagger
 * /api/invoices/by-id/{invoiceId}:
 *   get:
 *     summary: Get invoice by ID
 *     description: Get detailed invoice information by invoice ID
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Invoice details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the invoice owner or admin
 *       404:
 *         description: Invoice not found
 *       500:
 *         description: Server error
 */
// Add this endpoint if the controller has the method
if (invoiceController.getInvoiceById) {
  router.get('/by-id/:invoiceId', verifyToken, invoiceController.getInvoiceById);
}

/**
 * @swagger
 * /api/invoices/user:
 *   get:
 *     summary: Get user invoices
 *     description: Get all invoices for the authenticated user
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: List of user invoices with pagination
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Add this endpoint if the controller has the method
if (invoiceController.getUserInvoices) {
  router.get('/user', verifyToken, invoiceController.getUserInvoices);
}

module.exports = router;