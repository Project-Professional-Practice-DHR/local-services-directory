const express = require('express');
const paymentController = require('../controllers/paymentController');
const { verifyToken, authorize } = require('../middleware/auth');  // Import the verifyToken and authorize middlewares
const errorHandler = require('../middleware/errorHandler');

const router = express.Router();

// Create payment intent
router.post('/create-intent', 
  verifyToken, 
  authorize(['customer']),  // Use authorize to check if user is a 'customer'
  errorHandler(paymentController.createPaymentIntent)
);

// Confirm payment
router.post('/confirm', 
  verifyToken, 
  authorize(['customer']), 
  errorHandler(paymentController.confirmPayment)
);

// Get payment details
router.get('/:paymentId', 
  verifyToken, 
  errorHandler(paymentController.getPaymentDetails)
);

// Handle Stripe webhook (raw body for signature verification)
router.post('/webhook', 
  express.raw({ type: 'application/json' }), 
  errorHandler(paymentController.handleStripeWebhook)
);

// Process refund (for admins)
router.post('/refund', 
  verifyToken, 
  authorize(['admin']),  // Use authorize to check if user is an 'admin'
  errorHandler(paymentController.processRefund)
);

// Get customer payment history
router.get('/customer-history', 
  verifyToken, 
  authorize(['customer']), 
  errorHandler(paymentController.getCustomerPaymentHistory)
);

// Get provider payment history
router.get('/provider-history', 
  verifyToken, 
  authorize(['provider', 'admin']),  // Use authorize to check if user is 'provider' or 'admin'
  errorHandler(paymentController.getProviderPaymentHistory)
);

module.exports = router;