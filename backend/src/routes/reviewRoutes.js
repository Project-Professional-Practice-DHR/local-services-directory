const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Service review management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       required:
 *         - userId
 *         - providerId
 *         - rating
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated ID of the review
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID of the user who left the review
 *         providerId:
 *           type: string
 *           format: uuid
 *           description: ID of the service provider being reviewed
 *         serviceId:
 *           type: string
 *           format: uuid
 *           description: ID of the specific service being reviewed (optional)
 *           nullable: true
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Rating from 1-5
 *         reviewText:
 *           type: string
 *           description: Review text/comment
 *           nullable: true
 *         providerResponse:
 *           type: string
 *           description: The service provider's response to the review
 *           nullable: true
 *         reviewDate:
 *           type: string
 *           format: date-time
 *           description: When the review was created
 *         responseDate:
 *           type: string
 *           format: date-time
 *           description: When the provider responded to the review
 *           nullable: true
 *         isVerified:
 *           type: boolean
 *           description: Whether the review is from a verified customer who used the service
 *           default: false
 *         isFlagged:
 *           type: boolean
 *           description: Whether the review has been flagged for moderation
 *           default: false
 *         flagReason:
 *           type: string
 *           description: Reason the review was flagged
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a new review
 *     description: Submit a review for a service provider
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - providerId
 *               - rating
 *             properties:
 *               providerId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the service provider
 *               serviceId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the specific service (optional)
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1-5
 *               reviewText:
 *                 type: string
 *                 description: Review comment
 *     responses:
 *       201:
 *         description: Review submitted successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Cannot review (e.g., user hasn't used this service)
 *       500:
 *         description: Server error
 */
router.post('/', verifyToken, reviewController.createReview);

/**
 * @swagger
 * /api/reviews/service/{serviceId}:
 *   get:
 *     summary: Get reviews for a service
 *     description: Get all reviews for a specific service
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Service ID
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Minimum rating filter
 *       - in: query
 *         name: verifiedOnly
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Only show verified reviews
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of reviews to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of reviews to skip
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest, highest_rating, lowest_rating]
 *           default: newest
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of reviews
 *       404:
 *         description: Service not found
 *       500:
 *         description: Server error
 */
router.get('/service/:serviceId', reviewController.getServiceReviews);

/**
 * @swagger
 * /api/reviews/provider/{providerId}:
 *   get:
 *     summary: Get reviews for a provider
 *     description: Get all reviews for a specific service provider
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: providerId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Provider ID
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Minimum rating filter
 *       - in: query
 *         name: verifiedOnly
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Only show verified reviews
 *       - in: query
 *         name: serviceId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by specific service
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of reviews to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of reviews to skip
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest, highest_rating, lowest_rating]
 *           default: newest
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of reviews
 *       404:
 *         description: Provider not found
 *       500:
 *         description: Server error
 */
router.get('/provider/:providerId', reviewController.getProviderReviews);

/**
 * @swagger
 * /api/reviews/{reviewId}/response:
 *   post:
 *     summary: Add provider response to review
 *     description: Allow a service provider to respond to a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - providerResponse
 *             properties:
 *               providerResponse:
 *                 type: string
 *                 description: Provider's response to the review
 *     responses:
 *       200:
 *         description: Response added successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the service provider
 *       404:
 *         description: Review not found
 *       500:
 *         description: Server error
 */
router.post('/:reviewId/response', verifyToken, authorize('provider'), reviewController.addProviderResponse);

/**
 * @swagger
 * /api/reviews/{reviewId}/flag:
 *   post:
 *     summary: Flag a review
 *     description: Flag a review for moderation
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - flagReason
 *             properties:
 *               flagReason:
 *                 type: string
 *                 description: Reason for flagging the review
 *     responses:
 *       200:
 *         description: Review flagged successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the service provider
 *       404:
 *         description: Review not found
 *       500:
 *         description: Server error
 */
router.post('/:reviewId/flag', verifyToken, authorize('provider'), reviewController.flagReview);

/**
 * @swagger
 * /api/reviews/user/{userId}:
 *   get:
 *     summary: Get user reviews
 *     description: Get all reviews written by a specific user
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of user reviews
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the user or admin
 *       500:
 *         description: Server error
 */
router.get('/user/:userId', verifyToken, reviewController.getUserReviews);

module.exports = router;