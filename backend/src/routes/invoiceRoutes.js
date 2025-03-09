const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { verifyToken } = require('../middleware/auth');  // Import the verifyToken middleware


// Generate invoice for a payment (protected by verifyToken)
router.post('/generate/:paymentId', verifyToken, invoiceController.generateInvoice);

// Get invoice by payment ID (protected by verifyToken)
router.get('/:paymentId', verifyToken, invoiceController.getInvoiceByPaymentId);

module.exports = router;