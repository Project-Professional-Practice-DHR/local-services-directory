const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { verifyToken, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Services
 *   description: Service management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Service:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - price
 *         - providerId
 *         - ServiceCategoryId
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated ID of the service
 *         name:
 *           type: string
 *           description: Service name
 *           example: "Plumbing Repair"
 *         description:
 *           type: string
 *           description: Detailed service description
 *           example: "Professional repair of leaky faucets, pipes, and fixtures to prevent water damage."
 *         price:
 *           type: number
 *           format: float
 *           description: Service price (in USD)
 *           example: 75.00
 *         duration:
 *           type: integer
 *           description: Service duration in minutes
 *           example: 60
 *         providerId:
 *           type: string
 *           format: uuid
 *           description: ID of the service provider
 *         ServiceCategoryId:
 *           type: string
 *           format: uuid
 *           description: ID of the service category
 *         isActive:
 *           type: boolean
 *           description: Whether the service is currently active and available
 *           default: true
 *         images:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *           description: URLs to service images
 */

// Extract controller methods with fallbacks for missing methods
const getServices = serviceController?.getServices || ((req, res) => {
  res.status(501).json({ message: 'getServices function not implemented' });
});

const createService = serviceController?.createService || ((req, res) => {
  res.status(501).json({ message: 'createService function not implemented' });
});

const updateService = serviceController?.updateService || ((req, res) => {
  res.status(501).json({ message: 'updateService function not implemented' });
});

const deleteService = serviceController?.deleteService || ((req, res) => {
  res.status(501).json({ message: 'deleteService function not implemented' });
});

const getProviderServices = serviceController?.getProviderServices || ((req, res) => {
  res.status(501).json({ message: 'getProviderServices function not implemented' });
});

const getService = serviceController?.getService || ((req, res) => {
  res.status(501).json({ message: 'getService function not implemented' });
});

const getMyServices = serviceController?.getMyServices || ((req, res) => {
  res.status(501).json({ message: 'getMyServices function not implemented' });
});

const searchServices = serviceController?.searchServices || ((req, res) => {
  res.status(501).json({ message: 'searchServices function not implemented' });
});

// In serviceRoutes.js
router.get('/featured', serviceController.getFeaturedServices);

// Make sure these come BEFORE the dynamic ID route
router.get('/:id', serviceController.getService);


/**
 * @swagger
 * /api/services/search:
 *   get:
 *     summary: Search services
 *     description: Search for services with various filters
 *     tags: [Services]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Search keyword
 *       - in: query
 *         name: ServiceCategoryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Location for proximity search
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [price_asc, price_desc, rating, newest]
 *         description: Sort order
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
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Services search results
 *       500:
 *         description: Server error
 */
// Add this endpoint if the controller has the method
if (serviceController.searchServices) {
  router.get('/search', searchServices);
}

/**
 * @swagger
 * /api/services/create:
 *   post:
 *     summary: Create a new service
 *     description: Create a new service listing (provider only)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - price
 *               - ServiceCategoryId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Service name
 *               description:
 *                 type: string
 *                 description: Detailed description
 *               price:
 *                 type: number
 *                 description: Service price
 *               duration:
 *                 type: integer
 *                 description: Service duration in minutes
 *               ServiceCategoryId:
 *                 type: string
 *                 format: uuid
 *                 description: Category ID
 *               isActive:
 *                 type: boolean
 *                 description: Whether the service is active
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - price
 *               - ServiceCategoryId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Service name
 *               description:
 *                 type: string
 *                 description: Detailed description
 *               price:
 *                 type: number
 *                 description: Service price
 *               duration:
 *                 type: integer
 *                 description: Service duration in minutes
 *               ServiceCategoryId:
 *                 type: string
 *                 format: uuid
 *                 description: Category ID
 *               isActive:
 *                 type: boolean
 *                 description: Whether the service is active
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Service images
 *     responses:
 *       201:
 *         description: Service created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.post('/create', verifyToken, authorize(['provider']), createService);

/**
 * @swagger
 * /api/services/update/{id}:
 *   put:
 *     summary: Update a service
 *     description: Update an existing service (service owner only)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Service ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Service name
 *               description:
 *                 type: string
 *                 description: Detailed description
 *               price:
 *                 type: number
 *                 description: Service price
 *               duration:
 *                 type: integer
 *                 description: Service duration in minutes
 *               ServiceCategoryId:
 *                 type: string
 *                 format: uuid
 *                 description: Category ID
 *               isActive:
 *                 type: boolean
 *                 description: Whether the service is active
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Service name
 *               description:
 *                 type: string
 *                 description: Detailed description
 *               price:
 *                 type: number
 *                 description: Service price
 *               duration:
 *                 type: integer
 *                 description: Service duration in minutes
 *               ServiceCategoryId:
 *                 type: string
 *                 format: uuid
 *                 description: Category ID
 *               isActive:
 *                 type: boolean
 *                 description: Whether the service is active
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: New service images
 *               deleteImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Image IDs to delete
 *     responses:
 *       200:
 *         description: Service updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the service owner
 *       404:
 *         description: Service not found
 *       500:
 *         description: Server error
 */
router.put('/update/:id', verifyToken, authorize(['provider']), updateService);

/**
 * @swagger
 * /api/services/delete/{id}:
 *   delete:
 *     summary: Delete a service
 *     description: Delete a service (service owner only)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Service ID
 *     responses:
 *       200:
 *         description: Service deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the service owner
 *       404:
 *         description: Service not found
 *       500:
 *         description: Server error
 */
router.delete('/delete/:id', verifyToken, authorize(['provider']), deleteService);

/**
 * @swagger
 * /api/services/get:
 *   get:
 *     summary: Get all services
 *     description: Get a list of all active services
 *     tags: [Services]
 *     parameters:
 *       - in: query
 *         name: ServiceCategoryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Location to search near
 *       - in: query
 *         name: distance
 *         schema:
 *           type: number
 *         description: Maximum distance from location
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [price_asc, price_desc, rating, newest]
 *         description: Sort order
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of services to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of services to skip
 *     responses:
 *       200:
 *         description: List of services
 *       500:
 *         description: Server error
 */
router.get('/get', getServices);

/**
 * @swagger
 * /api/services/provider/{providerId}:
 *   get:
 *     summary: Get provider services
 *     description: Get services offered by a specific provider
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: providerId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Provider ID
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include inactive services (admin only)
 *     responses:
 *       200:
 *         description: List of provider services
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Provider not found
 *       500:
 *         description: Server error
 */
router.get('/provider/:providerId', verifyToken, getProviderServices);

/**
 * @swagger
 * /api/services/my-services:
 *   get:
 *     summary: Get my services
 *     description: Get services created by the authenticated provider
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include inactive services
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest, price_asc, price_desc, popularity]
 *           default: newest
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of your services
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/my-services', verifyToken, authorize(['provider']), getMyServices);

/**
 * @swagger
 * /api/services/{id}:
 *   get:
 *     summary: Get a service
 *     description: Get detailed information about a specific service
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Service ID
 *     responses:
 *       200:
 *         description: Service details
 *       404:
 *         description: Service not found
 *       500:
 *         description: Server error
 */
router.get('/:id', getService);

module.exports = router;