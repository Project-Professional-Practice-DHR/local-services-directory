const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken, authorize } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       required:
 *         - user_id
 *         - provider_id
 *         - rating
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated ID of the review
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: ID of the user who left the review
 *         provider_id:
 *           type: string
 *           format: uuid
 *           description: ID of the service provider being reviewed
 *         service_id:
 *           type: string
 *           format: uuid
 *           description: ID of the specific service being reviewed (optional)
 *           nullable: true
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Rating from 1-5
 *         review_text:
 *           type: string
 *           description: Review text/comment
 *           nullable: true
 *         provider_response:
 *           type: string
 *           description: The service provider's response to the review
 *           nullable: true
 *         review_date:
 *           type: string
 *           format: date-time
 *           description: When the review was created
 *         response_date:
 *           type: string
 *           format: date-time
 *           description: When the provider responded to the review
 *           nullable: true
 *         is_verified:
 *           type: boolean
 *           description: Whether the review is from a verified customer who used the service
 *           default: false
 *         is_flagged:
 *           type: boolean
 *           description: Whether the review has been flagged for moderation
 *           default: false
 *         flag_reason:
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
 *       example:
 *         id: "123e4567-e89b-12d3-a456-426614174000"
 *         user_id: "123e4567-e89b-12d3-a456-426614174001"
 *         provider_id: "123e4567-e89b-12d3-a456-426614174002"
 *         service_id: "123e4567-e89b-12d3-a456-426614174003"
 *         rating: 4
 *         review_text: "Very professional service. Arrived on time and did a great job fixing our plumbing issue."
 *         provider_response: "Thank you for your feedback! We're glad we could help with your plumbing needs."
 *         review_date: "2023-01-01T00:00:00.000Z"
 *         response_date: "2023-01-02T00:00:00.000Z"
 *         is_verified: true
 *         is_flagged: false
 *         createdAt: "2023-01-01T00:00:00.000Z"
 *         updatedAt: "2023-01-02T00:00:00.000Z"
 */

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a new review
 *     description: Submit a review for a service provider after using their services.
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
 *               - provider_id
 *               - rating
 *             properties:
 *               provider_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the service provider
 *               service_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the specific service (optional)
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1-5
 *               review_text:
 *                 type: string
 *                 description: Review comment
 *     responses:
 *       201:
 *         description: Review created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Review submitted successfully"
 *                 review:
 *                   $ref: '#/components/schemas/Review'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Rating must be between 1 and 5"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Cannot review (e.g., user hasn't used this service)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "You can only review services you have used"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', verifyToken, reviewController.createReview);

/**
 * @swagger
 * /api/reviews/service/{serviceId}:
 *   get:
 *     summary: Get all reviews for a specific service
 *     description: Retrieve all reviews for a particular service, with optional filtering.
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
 *         name: min_rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Minimum rating to filter by
 *       - in: query
 *         name: verified_only
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
 *         description: Sort order for reviews
 *     responses:
 *       200:
 *         description: List of reviews for the service
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviews:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Review'
 *                       - type: object
 *                         properties:
 *                           user:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               username:
 *                                 type: string
 *                               profile_picture:
 *                                 type: string
 *                                 nullable: true
 *                 total_count:
 *                   type: integer
 *                   description: Total number of reviews for this service
 *                   example: 25
 *                 average_rating:
 *                   type: number
 *                   format: float
 *                   description: Average rating for this service
 *                   example: 4.5
 *                 rating_distribution:
 *                   type: object
 *                   description: Count of reviews by rating
 *                   properties:
 *                     "1":
 *                       type: integer
 *                     "2":
 *                       type: integer
 *                     "3":
 *                       type: integer
 *                     "4":
 *                       type: integer
 *                     "5":
 *                       type: integer
 *       404:
 *         description: Service not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Service not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/service/:serviceId', reviewController.getServiceReviews);

/**
 * @swagger
 * /api/reviews/provider/{providerId}:
 *   get:
 *     summary: Get all reviews for a specific provider
 *     description: Retrieve all reviews for a particular service provider, with optional filtering.
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
 *         name: min_rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Minimum rating to filter by
 *       - in: query
 *         name: verified_only
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Only show verified reviews
 *       - in: query
 *         name: service_id
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
 *         description: Sort order for reviews
 *     responses:
 *       200:
 *         description: List of reviews for the provider
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviews:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Review'
 *                       - type: object
 *                         properties:
 *                           user:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               username:
 *                                 type: string
 *                               profile_picture:
 *                                 type: string
 *                                 nullable: true
 *                           service:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                             nullable: true
 *                 total_count:
 *                   type: integer
 *                   description: Total number of reviews for this provider
 *                   example: 42
 *                 average_rating:
 *                   type: number
 *                   format: float
 *                   description: Average rating for this provider
 *                   example: 4.8
 *                 rating_distribution:
 *                   type: object
 *                   description: Count of reviews by rating
 *                   properties:
 *                     "1":
 *                       type: integer
 *                     "2":
 *                       type: integer
 *                     "3":
 *                       type: integer
 *                     "4":
 *                       type: integer
 *                     "5":
 *                       type: integer
 *       404:
 *         description: Provider not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Provider not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/provider/:providerId', reviewController.getProviderReviews);

/**
 * @swagger
 * /api/reviews/{reviewId}/response:
 *   post:
 *     summary: Add a provider response to a review
 *     description: Allows service providers to respond to reviews about their services.
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
 *               - provider_response
 *             properties:
 *               provider_response:
 *                 type: string
 *                 description: Provider's response to the review
 *                 example: "Thank you for your feedback! We're glad we could help with your plumbing needs."
 *     responses:
 *       200:
 *         description: Response added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Response added successfully"
 *                 review:
 *                   $ref: '#/components/schemas/Review'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Response text is required"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - not the service provider
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "You can only respond to reviews about your own services"
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/:reviewId/response', verifyToken, authorize('provider'), reviewController.addProviderResponse);

/**
 * @swagger
 * /api/reviews/{reviewId}/flag:
 *   post:
 *     summary: Flag a review for moderation
 *     description: Allows service providers to flag inappropriate or fraudulent reviews for admin moderation.
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
 *               - flag_reason
 *             properties:
 *               flag_reason:
 *                 type: string
 *                 description: Reason for flagging the review
 *                 example: "This review contains inappropriate language and false claims"
 *     responses:
 *       200:
 *         description: Review flagged successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Review flagged for moderation"
 *                 review:
 *                   $ref: '#/components/schemas/Review'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Flag reason is required"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - not the service provider
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "You can only flag reviews about your own services"
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/:reviewId/flag', verifyToken, authorize('provider'), reviewController.flagReview);

/**
 * @swagger
 * /api/reviews/user/{userId}:
 *   get:
 *     summary: Get all reviews left by a specific user
 *     description: Retrieve all reviews written by a particular user. Users can only view their own reviews unless they're an admin.
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
 *         description: List of reviews by the user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviews:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Review'
 *                       - type: object
 *                         properties:
 *                           provider:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                           service:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                             nullable: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - not the user or admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "You can only view your own reviews"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/user/:userId', verifyToken, reviewController.getUserReviews);

module.exports = router;