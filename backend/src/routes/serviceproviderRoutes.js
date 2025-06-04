const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');
const serviceproviderController = require('../controllers/serviceproviderController');

/**
 * @swagger
 * tags:
 *   name: ServiceProvider
 *   description: Service provider management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ServiceProviderProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated ID of the service provider profile
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID of the user who owns this profile
 *         businessName:
 *           type: string
 *           description: Name of the business
 *         description:
 *           type: string
 *           description: Business description
 *         address:
 *           type: string
 *           description: Street address
 *         city:
 *           type: string
 *           description: City
 *         state:
 *           type: string
 *           description: State or province
 *         zipCode:
 *           type: string
 *           description: Postal code
 *         latitude:
 *           type: number
 *           format: float
 *           description: Latitude coordinate
 *         longitude:
 *           type: number
 *           format: float
 *           description: Longitude coordinate
 *         website:
 *           type: string
 *           description: Business website URL
 *         businessHours:
 *           type: object
 *           description: Operating hours by day
 *         businessLicense:
 *           type: string
 *           description: URL to business license document
 *         isVerified:
 *           type: boolean
 *           description: Whether the business is verified
 *         averageRating:
 *           type: number
 *           format: float
 *           description: Average rating of the service provider
 *         services:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Service'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     Service:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated ID of the service
 *         name:
 *           type: string
 *           description: Service name
 *         description:
 *           type: string
 *           description: Service description
 *         price:
 *           type: number
 *           format: float
 *           description: Service price
 *         pricingType:
 *           type: string
 *           enum: [fixed, hourly, quote]
 *           description: Type of pricing model
 *         duration:
 *           type: integer
 *           description: Service duration in minutes
 *         isActive:
 *           type: boolean
 *           description: Whether the service is currently offered
 */

/**
 * @swagger
 * /api/provider-bookings:
 *   get:
 *     summary: Get current user's business profile
 *     description: Retrieves the service provider profile for the authenticated user
 *     tags: [ServiceProvider]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ServiceProviderProfile'
 *       401:
 *         description: Unauthorized - user not authenticated
 *       404:
 *         description: Service provider profile not found
 *       500:
 *         description: Server error
 */
router.get('/provider-bookings', verifyToken, async (req, res) => {
    try {
      // Check if user has a provider profile
      const profile = await serviceproviderController.getMyProfile(req, res);
      
      // If getMyProfile didn't send a response (which it usually does),
      // we'll handle it here
      if (!res.headersSent) {
        res.status(200).json({
          success: true,
          data: profile || []
        });
      }
    } catch (error) {
      console.error('Error in provider-bookings route:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching provider data',
        error: error.message
      });
    }
  });
  

/**
 * @swagger
 * /api/serviceprovider/profile:
 *   post:
 *     summary: Create a service provider profile
 *     description: Creates a new service provider profile for the authenticated user
 *     tags: [ServiceProvider]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessName
 *               - address
 *               - city
 *               - state
 *               - zipCode
 *             properties:
 *               businessName:
 *                 type: string
 *                 description: Name of the business
 *               description:
 *                 type: string
 *                 description: Business description
 *               address:
 *                 type: string
 *                 description: Street address
 *               city:
 *                 type: string
 *                 description: City
 *               state:
 *                 type: string
 *                 description: State or province
 *               zipCode:
 *                 type: string
 *                 description: Postal code
 *               website:
 *                 type: string
 *                 description: Business website URL
 *               businessHours:
 *                 type: object
 *                 description: Operating hours by day
 *     responses:
 *       201:
 *         description: Profile created successfully
 *       400:
 *         description: Bad request or profile already exists
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/serviceprovider/profile', verifyToken, serviceproviderController.createProfile);

/**
 * @swagger
 * /api/serviceprovider/profile:
 *   put:
 *     summary: Update service provider profile
 *     description: Updates the service provider profile for the authenticated user
 *     tags: [ServiceProvider]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               businessName:
 *                 type: string
 *                 description: Name of the business
 *               description:
 *                 type: string
 *                 description: Business description
 *               address:
 *                 type: string
 *                 description: Street address
 *               city:
 *                 type: string
 *                 description: City
 *               state:
 *                 type: string
 *                 description: State or province
 *               zipCode:
 *                 type: string
 *                 description: Postal code
 *               website:
 *                 type: string
 *                 description: Business website URL
 *               businessHours:
 *                 type: object
 *                 description: Operating hours by day
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Server error
 */
router.put('/serviceprovider/profile', verifyToken, serviceproviderController.updateProfile);

/**
 * @swagger
 * /api/serviceprovider/profile/{id}:
 *   get:
 *     summary: Get a service provider's profile
 *     description: Retrieves the profile of a specific service provider by ID
 *     tags: [ServiceProvider]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Service provider profile ID
 *     responses:
 *       200:
 *         description: Successful operation
 *       404:
 *         description: Service provider profile not found
 *       500:
 *         description: Server error
 */
router.get('/serviceprovider/profile/:id', serviceproviderController.getProfile);

/**
 * @swagger
 * /api/serviceprovider/profile/me:
 *   get:
 *     summary: Get current user's service provider profile
 *     description: Retrieves the service provider profile for the authenticated user
 *     tags: [ServiceProvider]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful operation
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Service provider profile not found
 *       500:
 *         description: Server error
 */
router.get('/serviceprovider/profile/me', verifyToken, serviceproviderController.getMyProfile);

/**
 * @swagger
 * /api/serviceprovider/search:
 *   get:
 *     summary: Search for service providers
 *     description: Search for service providers with various filters
 *     tags: [ServiceProvider]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by service category ID
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Search keyword in name or description
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Location to search around
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *         description: Radius in kilometers to search around the location
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *         description: Minimum rating filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
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
 *         description: Results per page
 *     responses:
 *       200:
 *         description: Successful operation
 *       500:
 *         description: Server error
 */
router.get('/serviceprovider/search', serviceproviderController.searchProviders);

/**
 * @swagger
 * /api/serviceprovider/documents:
 *   post:
 *     summary: Upload business documents
 *     description: Upload business license or other verification documents
 *     tags: [ServiceProvider]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Document file to upload
 *     responses:
 *       200:
 *         description: Document uploaded successfully
 *       400:
 *         description: No file provided
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Service provider profile not found
 *       500:
 *         description: Server error
 */
router.post('/serviceprovider/documents', verifyToken, serviceproviderController.uploadBusinessDocuments);

module.exports = router;