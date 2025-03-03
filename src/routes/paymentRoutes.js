const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');

router.post('/create-intent', auth, paymentController.createPaymentIntent);
router.post('/confirm', auth, paymentController.confirmPayment);
router.get('/:paymentId', auth, paymentController.getPaymentDetails);

// Addition to the original
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleStripeWebhook);
router.post('/refund', auth, paymentController.processRefund);
router.get('/customer-history', auth, paymentController.getCustomerPaymentHistory);
router.get('/provider-history', auth, paymentController.getProviderPaymentHistory);

module.exports = router;