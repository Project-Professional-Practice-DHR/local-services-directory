const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken, authorize } = require('../middleware/auth');  // Import the verifyToken and authorize middlewares

// Create a new review
router.post('/', verifyToken, reviewController.createReview);

// Get reviews for a service
router.get('/service/:serviceId', reviewController.getServiceReviews);

// Get reviews for a provider
router.get('/provider/:providerId', reviewController.getProviderReviews);

// Add provider response to a review
router.post('/:reviewId/response', verifyToken, authorize('provider'), reviewController.addProviderResponse);

// Flag a review for moderation
router.post('/:reviewId/flag', verifyToken, authorize('provider'), reviewController.flagReview);

module.exports = router;