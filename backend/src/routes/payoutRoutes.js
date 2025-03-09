const express = require('express');
const router = express.Router();
const payoutController = require('../controllers/payoutController');
const { verifyToken, authorize } = require('../middleware/auth');  // Import the verifyToken and authorize middlewares

// Schedule payouts (admin only)
router.post('/schedule', verifyToken, authorize('admin'), payoutController.schedulePayouts);

// Process pending payouts (admin only)
router.post('/process', verifyToken, authorize('admin'), payoutController.processPayouts);

// Get provider's own payouts
router.get('/provider', verifyToken, authorize('provider'), payoutController.getProviderPayouts);

module.exports = router;