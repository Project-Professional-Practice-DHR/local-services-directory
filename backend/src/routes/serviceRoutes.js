const express = require('express');
const serviceController = require('../controllers/serviceController');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// Extract controller methods with error handling
const getServices = serviceController.getServices || ((req, res) => {
  res.status(501).json({ message: 'getServices function not implemented' });
});

const createService = serviceController.createService || ((req, res) => {
  res.status(501).json({ message: 'createService function not implemented' });
});

const updateService = serviceController.updateService || ((req, res) => {
  res.status(501).json({ message: 'updateService function not implemented' });
});

const deleteService = serviceController.deleteService || ((req, res) => {
  res.status(501).json({ message: 'deleteService function not implemented' });
});

const getProviderServices = serviceController.getProviderServices || ((req, res) => {
  res.status(501).json({ message: 'getProviderServices function not implemented' });
});

const getService = serviceController.getService || ((req, res) => {
  res.status(501).json({ message: 'getService function not implemented' });
});

const getMyServices = serviceController.getMyServices || ((req, res) => {
  res.status(501).json({ message: 'getMyServices function not implemented' });
});

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
 *         - provider_id
 *         - category_id
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
 *         provider_id:
 *           type: string
 *           format: uuid
 *           description: ID of the service provider
 *         category_id:
 *           type: string
 *           format: uuid
 *           description: ID of the service category
 *         is_active:
 *           type: boolean
 *           description: Whether the service is currently active and available
 *           default: true
 *         images:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *           description: URLs to service images
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
 *         name: "Plumbing Repair"
 *         description: "Professional repair of leaky faucets, pipes, and fixtures to prevent water damage."
 *         price: 75.00
 *         duration: 60
 *         provider_id: "123e4567-e89b-12d3-a456-426614174001"
 *         category_id: "123e4567-e89b-12d3-a456-426614174002"
 *         is_active: true
 *         images: ["/uploads/services/plumbing1.jpg", "/uploads/services/plumbing2.jpg"]
 *         createdAt: "2023-01-01T00:00:00.000Z"
 *         updatedAt: "2023-01-01T00:00:00.000Z"
 * 
 *     ServiceCategory:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Category ID
 *         name:
 *           type: string
 *           description: Category name
 *         parent_id:
 *           type: string
 *           format: uuid
 *           description: Parent category ID (for subcategories)
 *           nullable: true
 *       example:
 *         id: "123e4567-e89b-12d3-a456-426614174002"
 *         name: "Plumbing"
 *         parent_id: "123e4567-e89b-12d3-a456-426614174003"
 */

/**
 * @swagger
 * /api/services/create:
 *   post:
 *     summary: Create a new service
 *     description: Creates a new service listing for the authenticated service provider.
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
 *               - category_id
 *             properties:
 *               name:
 *                 type: string
 *                 description: Service name
 *                 example: "Plumbing Repair"
 *               description:
 *                 type: string
 *                 description: Detailed description of the service
 *                 example: "Professional repair of leaky faucets, pipes, and fixtures to prevent water damage."
 *               price:
 *                 type: number
 *                 description: Service price (in USD)
 *                 example: 75.00
 *               duration:
 *                 type: integer
 *                 description: Service duration in minutes
 *                 example: 60
 *               category_id:
 *                 type: string
 *                 format: uuid
 *                 description: Category ID for the service
 *                 example: "123e4567-e89b-12d3-a456-426614174002"
 *               is_active:
 *                 type: boolean
 *                 description: Whether the service is active
 *                 default: true
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - price
 *               - category_id
 *             properties:
 *               name:
 *                 type: string
 *                 description: Service name
 *               description:
 *                 type: string
 *                 description: Detailed description of the service
 *               price:
 *                 type: number
 *                 description: Service price (in USD)
 *               duration:
 *                 type: integer
 *                 description: Service duration in minutes
 *               category_id:
 *                 type: string
 *                 format: uuid
 *                 description: Category ID for the service
 *               is_active:
 *                 type: boolean
 *                 description: Whether the service is active
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Service images (up to 5)
 *     responses:
 *       201:
 *         description: Service created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Service created successfully"
 *                 service:
 *                   $ref: '#/components/schemas/Service'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/create', verifyToken, createService);

/**
 * @swagger
 * /api/services/update/{id}:
 *   put:
 *     summary: Update an existing service
 *     description: Update details of an existing service. Only the service owner can update their services.
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
 *         example: "123e4567-e89b-12d3-a456-426614174000"
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
 *                 description: Detailed description of the service
 *               price:
 *                 type: number
 *                 description: Service price
 *               duration:
 *                 type: integer
 *                 description: Service duration in minutes
 *               category_id:
 *                 type: string
 *                 format: uuid
 *                 description: Category ID for the service
 *               is_active:
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
 *                 description: Detailed description of the service
 *               price:
 *                 type: number
 *                 description: Service price
 *               duration:
 *                 type: integer
 *                 description: Service duration in minutes
 *               category_id:
 *                 type: string
 *                 format: uuid
 *                 description: Category ID for the service
 *               is_active:
 *                 type: boolean
 *                 description: Whether the service is active
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: New service images (up to 5)
 *               delete_images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Image IDs to delete
 *     responses:
 *       200:
 *         description: Service updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Service updated successfully"
 *                 service:
 *                   $ref: '#/components/schemas/Service'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - not the service owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "You can only update your own services"
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/update/:id', verifyToken, updateService);

/**
 * @swagger
 * /api/services/delete/{id}:
 *   delete:
 *     summary: Delete a service
 *     description: Delete a service listing. Only the service owner can delete their services.
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
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Service deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Service deleted successfully"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - not the service owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "You can only delete your own services"
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/delete/:id', verifyToken, deleteService);

/**
 * @swagger
 * /api/services/get:
 *   get:
 *     summary: Get all services
 *     description: Retrieve a list of services with various filtering options.
 *     tags: [Services]
 *     parameters:
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category
 *       - in: query
 *         name: min_price
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: max_price
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for service name or description
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Location to search near
 *       - in: query
 *         name: distance
 *         schema:
 *           type: number
 *         description: Maximum distance in kilometers from location
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 services:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Service'
 *                 total:
 *                   type: integer
 *                   description: Total number of services matching the query
 *                   example: 100
 *                 page:
 *                   type: integer
 *                   description: Current page number
 *                   example: 1
 *                 pages:
 *                   type: integer
 *                   description: Total number of pages
 *                   example: 10
 *                 limit:
 *                   type: integer
 *                   description: Number of services per page
 *                   example: 10
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/get', getServices);

/**
 * @swagger
 * /api/services/provider/{providerId}:
 *   get:
 *     summary: Get services by provider ID
 *     description: Retrieve all services offered by a specific provider.
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
 *         name: include_inactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Whether to include inactive services (admin only)
 *     responses:
 *       200:
 *         description: List of services for the specified provider
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 services:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Service'
 *                 provider:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     rating:
 *                       type: number
 *                       format: float
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
router.get('/provider/:providerId', verifyToken, getProviderServices);

/**
 * @swagger
 * /api/services/my-services:
 *   get:
 *     summary: Get services created by the authenticated user
 *     description: Retrieve all services created by the currently authenticated service provider.
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: include_inactive
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Whether to include inactive services
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest, price_asc, price_desc, popularity]
 *           default: newest
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of services created by the authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 services:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Service'
 *                 total:
 *                   type: integer
 *                   description: Total number of services
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/my-services', verifyToken, getMyServices);

/**
 * @swagger
 * /api/services/{id}:
 *   get:
 *     summary: Get a service by ID
 *     description: Retrieve detailed information about a specific service.
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 service:
 *                   $ref: '#/components/schemas/Service'
 *                 provider:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     rating:
 *                       type: number
 *                       format: float
 *                     contact_info:
 *                       type: object
 *                     location:
 *                       type: object
 *                 category:
 *                   $ref: '#/components/schemas/ServiceCategory'
 *                 reviews:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       rating:
 *                         type: number
 *                       comment:
 *                         type: string
 *                   description: Recent reviews (limited to 5)
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', getService);

// Export the router object
module.exports = router;