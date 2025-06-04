const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { verifyToken } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Location
 *   description: Location and geospatial endpoints
 */

/**
 * @swagger
 * /api/location/user:
 *   post:
 *     summary: Update user location
 *     description: Update the authenticated user's location
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *             properties:
 *               address:
 *                 type: string
 *                 description: User's address to geocode
 *     responses:
 *       200:
 *         description: Location updated successfully
 *       400:
 *         description: Missing or invalid address
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/user', verifyToken, locationController.updateUserLocation);

/**
 * @swagger
 * /api/location/validate:
 *   post:
 *     summary: Validate address
 *     description: Validate and geocode an address
 *     tags: [Location]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *             properties:
 *               address:
 *                 type: string
 *                 description: Address to validate
 *     responses:
 *       200:
 *         description: Address validated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 formattedAddress:
 *                   type: string
 *                 location:
 *                   type: object
 *                   properties:
 *                     lat:
 *                       type: number
 *                     lng:
 *                       type: number
 *       400:
 *         description: Invalid address
 *       500:
 *         description: Server error
 */
router.post('/validate', locationController.validateAddress);

/**
 * @swagger
 * /api/location/reverse:
 *   get:
 *     summary: Reverse geocode
 *     description: Convert coordinates to address
 *     tags: [Location]
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         required: true
 *         description: Latitude
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *         required: true
 *         description: Longitude
 *     responses:
 *       200:
 *         description: Address found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 formattedAddress:
 *                   type: string
 *                 components:
 *                   type: object
 *       400:
 *         description: Missing or invalid coordinates
 *       500:
 *         description: Server error
 */
router.get('/reverse', locationController.reverseGeocode);

/**
 * @swagger
 * /api/location/distance:
 *   post:
 *     summary: Calculate distance
 *     description: Calculate distance between two points
 *     tags: [Location]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - origin
 *               - destination
 *             properties:
 *               origin:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                   lng:
 *                     type: number
 *               destination:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                   lng:
 *                     type: number
 *     responses:
 *       200:
 *         description: Distance calculated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 kilometers:
 *                   type: number
 *                 miles:
 *                   type: number
 *                 text:
 *                   type: string
 *       400:
 *         description: Missing or invalid points
 *       500:
 *         description: Server error
 */
router.post('/distance', locationController.calculateDistance);

/**
 * @swagger
 * /api/location/nearby:
 *   get:
 *     summary: Find nearby providers
 *     description: Find service providers near a location
 *     tags: [Location]
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         required: true
 *         description: Latitude
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *         required: true
 *         description: Longitude
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 10
 *         description: Search radius in kilometers
 *       - in: query
 *         name: serviceType
 *         schema:
 *           type: string
 *         description: Filter by service type
 *     responses:
 *       200:
 *         description: List of nearby providers
 *       400:
 *         description: Missing or invalid coordinates
 *       500:
 *         description: Server error
 */
router.get('/nearby', locationController.findNearbyProviders);

module.exports = router;