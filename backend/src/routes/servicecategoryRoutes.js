const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');

// Import the correct controller
let serviceCategoryController;
try {
  serviceCategoryController = require('../controllers/serviceCategoryController');
} catch (error) {
  console.warn('Service category controller not found, using placeholders');
  serviceCategoryController = {};
}

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Service categories and subcategories
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated id of the category
 *         name:
 *           type: string
 *           description: Category name
 *         description:
 *           type: string
 *           description: Category description
 *         icon:
 *           type: string
 *           description: Icon identifier or URL
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the category was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the category was last updated
 */

// Use controller methods if they exist, otherwise use placeholders
const getAllCategories = serviceCategoryController.getAllCategories || ((req, res) => {
  res.status(200).json({
    success: true,
    message: 'Placeholder: Categories functionality not yet implemented',
    data: []
  });
});

const getCategoryById = serviceCategoryController.getCategoryById || ((req, res) => {
  res.status(200).json({
    success: true,
    message: `Placeholder: Category ${req.params.id} details functionality not yet implemented`,
    data: { id: req.params.id, name: "Sample Category" }
  });
});

const createCategory = serviceCategoryController.createCategory || ((req, res) => {
  res.status(201).json({
    success: true,
    message: 'Placeholder: Create category functionality not yet implemented',
    data: req.body
  });
});

const updateCategory = serviceCategoryController.updateCategory || ((req, res) => {
  res.status(200).json({
    success: true,
    message: `Placeholder: Update category ${req.params.id} functionality not yet implemented`,
    data: { id: req.params.id, ...req.body }
  });
});

const deleteCategory = serviceCategoryController.deleteCategory || ((req, res) => {
  res.status(200).json({
    success: true,
    message: `Placeholder: Delete category ${req.params.id} functionality not yet implemented`
  });
});

const getCategoryServices = serviceCategoryController.getCategoryServices || ((req, res) => {
  res.status(200).json({
    success: true,
    message: `Placeholder: Services for category ${req.params.id} functionality not yet implemented`,
    data: []
  });
});

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     description: Retrieve all service categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: A list of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *       500:
 *         description: Server error
 */
router.get('/', getAllCategories);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     description: Retrieve a specific category by its ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.get('/:id', getCategoryById);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category
 *     description: Create a new service category (admin only)
 *     tags: [Categories]
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
 *             properties:
 *               name:
 *                 type: string
 *                 description: Category name
 *               description:
 *                 type: string
 *                 description: Category description
 *               icon:
 *                 type: string
 *                 description: Icon identifier or URL
 *     responses:
 *       201:
 *         description: Category created successfully
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
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.post('/', verifyToken, authorize(['admin']), createCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update a category
 *     description: Update an existing service category (admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Category name
 *               description:
 *                 type: string
 *                 description: Category description
 *               icon:
 *                 type: string
 *                 description: Icon identifier or URL
 *     responses:
 *       200:
 *         description: Category updated successfully
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
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.put('/:id', verifyToken, authorize(['admin']), updateCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     description: Delete a service category (admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Cannot delete category with services
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', verifyToken, authorize(['admin']), deleteCategory);

/**
 * @swagger
 * /api/categories/{id}/services:
 *   get:
 *     summary: Get services by category
 *     description: Retrieve all services in a specific category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Category ID
 *     responses:
 *       200:
 *         description: List of services in the category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       price:
 *                         type: number
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.get('/:id/services', getCategoryServices);

module.exports = router;