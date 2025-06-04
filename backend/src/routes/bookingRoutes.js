const express = require('express');
const router = express.Router();
const { 
  Booking, 
  Service, 
  ServiceProviderProfile, 
  User 
} = require('../models');
const { verifyToken, authorize } = require('../middleware/auth');
const bookingController = require('../controllers/bookingController');

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Comprehensive booking management operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       required:
 *         - serviceId
 *         - userId
 *         - providerId
 *         - bookingDate
 *         - startTime
 *         - endTime
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the booking
 *         serviceId:
 *           type: string
 *           format: uuid
 *           description: ID of the booked service
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID of the customer
 *         providerId:
 *           type: string
 *           format: uuid
 *           description: ID of the service provider
 *         bookingDate:
 *           type: string
 *           format: date
 *           description: Date of the booking
 *         startTime:
 *           type: string
 *           format: time
 *           description: Start time of the booking
 *         endTime:
 *           type: string
 *           format: time
 *           description: End time of the booking
 *         status:
 *           type: string
 *           enum: [pending, confirmed, in_progress, completed, cancelled, rejected]
 *           default: pending
 *           description: Current status of the booking
 *         notes:
 *           type: string
 *           description: Additional notes for the booking
 *         price:
 *           type: number
 *           format: float
 *           description: Price of the booking
 *         bookingReference:
 *           type: string
 *           description: Unique reference number for the booking
 *         cancellationReason:
 *           type: string
 *           description: Reason for cancellation (if applicable)
 */

/**
 * @swagger
 * /api/booking:
 *   get:
 *     summary: Retrieve all bookings (Admin only)
 *     description: Fetch a paginated list of all bookings with optional filtering
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of bookings per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, in_progress, completed, cancelled, rejected]
 *         description: Filter bookings by status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for booking date range filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for booking date range filter
 *     responses:
 *       200:
 *         description: Successfully retrieved bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.get('/', verifyToken, authorize(['admin']), bookingController.getBookings);

/**
 * @swagger
 * /api/booking/my-bookings:
 *   get:
 *     summary: Retrieve user's bookings
 *     description: Fetch a paginated list of bookings for the authenticated user
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of bookings per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, in_progress, completed, cancelled, rejected]
 *         description: Filter bookings by status
 *     responses:
 *       200:
 *         description: Successfully retrieved user bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized access
 *       500:
 *         description: Server error
 */
router.get('/my-bookings', verifyToken, bookingController.getUserBookings);

/**
 * @swagger
 * /api/booking/provider-bookings:
 *   get:
 *     summary: Retrieve provider's bookings
 *     description: Fetch a paginated list of bookings for the authenticated service provider
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of bookings per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, in_progress, completed, cancelled, rejected]
 *         description: Filter bookings by status
 *     responses:
 *       200:
 *         description: Successfully retrieved provider bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Forbidden - Provider access required
 *       500:
 *         description: Server error
 */
router.get('/provider-bookings', verifyToken, authorize(['provider']), bookingController.getProviderBookings);

/**
 * @swagger
 * /api/booking:
 *   post:
 *     summary: Create a new booking
 *     description: Create a booking for a specific service
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *               - bookingDate
 *               - startTime
 *               - endTime
 *             properties:
 *               serviceId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the service to book
 *               bookingDate:
 *                 type: string
 *                 format: date
 *                 description: Date of the booking
 *               startTime:
 *                 type: string
 *                 format: time
 *                 description: Start time of the booking
 *               endTime:
 *                 type: string
 *                 format: time
 *                 description: End time of the booking
 *               notes:
 *                 type: string
 *                 description: Additional notes for the booking
 *               price:
 *                 type: number
 *                 description: Optional price for the booking
 *               status:
 *                 type: string
 *                 default: pending
 *                 enum: [pending, confirmed, in_progress, completed, cancelled, rejected]
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Invalid input or missing required fields
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: Service not found
 *       500:
 *         description: Server error
 */
router.post('/', verifyToken, bookingController.createBooking);

/**
 * @swagger
 * /api/booking/{id}:
 *   get:
 *     summary: Retrieve a specific booking
 *     description: Get detailed information about a specific booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the booking
 *     responses:
 *       200:
 *         description: Successfully retrieved booking details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.get('/:id', verifyToken, bookingController.getBooking);

/**
 * @swagger
 * /api/booking/{id}:
 *   put:
 *     summary: Update a booking
 *     description: Modify details of an existing booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the booking
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, in_progress, completed, cancelled, rejected]
 *                 description: Updated booking status
 *               notes:
 *                 type: string
 *                 description: Updated booking notes
 *               cancellationReason:
 *                 type: string
 *                 description: Reason for cancellation
 *               startTime:
 *                 type: string
 *                 format: time
 *                 description: Updated start time
 *               endTime:
 *                 type: string
 *                 format: time
 *                 description: Updated end time
 *               bookingDate:
 *                 type: string
 *                 format: date
 *                 description: Updated booking date
 *               price:
 *                 type: number
 *                 description: Updated booking price
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.put('/:id', verifyToken, bookingController.updateBooking);

/**
 * @swagger
 * /api/booking/{id}:
 *   delete:
 *     summary: Delete a booking
 *     description: Remove a specific booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the booking
 *     responses:
 *       200:
 *         description: Booking deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', verifyToken, bookingController.deleteBooking);

/**
 * @swagger
 * /api/booking/{id}/cancel:
 *   post:
 *     summary: Cancel a booking
 *     description: Cancel a booking with an optional cancellation reason
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the booking
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for cancellation
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.post('/:id/cancel', verifyToken, bookingController.cancelBooking);

/**
 * @swagger
 * /api/booking/{id}/reschedule:
 *   post:
 *     summary: Reschedule a booking
 *     description: Change the date and time of an existing booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the booking
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - time
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 description: New date for the booking
 *               time:
 *                 type: string
 *                 format: time
 *                 description: New start time for the booking
 *     responses:
 *       200:
 *         description: Booking rescheduled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Invalid input or missing required fields
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.post('/:id/reschedule', verifyToken, bookingController.rescheduleBooking);


// Additional route for backward compatibility
router.get('/booking/my-bookings', verifyToken, bookingController.getUserBookings);

module.exports = router;