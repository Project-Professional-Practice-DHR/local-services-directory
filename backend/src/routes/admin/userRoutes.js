const express = require('express');
const router = express.Router();
const UserController = require('../../controllers/admin/userController');
const { validateRequest } = require('../../middleware/validation');
const { verifyAdmin } = require('../../middleware/auth');
const { getUsersSchema, updateUserStatusSchema, verifyProviderSchema } = require('../../validation/adminValidation');

// Apply admin verification middleware to all routes
router.use(verifyAdmin);

// List and search users
router.get(
  '/users',
  validateRequest(getUsersSchema),
  UserController.getUsers
);

// Get single user details
router.get(
  '/users/:id',
  UserController.getUserById
);

// Suspend or ban user
router.put(
  '/users/:id/status',
  validateRequest(updateUserStatusSchema),
  UserController.updateUserStatus
);

// Verify service provider
router.put(
  '/providers/:id/verify',
  validateRequest(verifyProviderSchema),
  UserController.verifyProvider
);

module.exports = router;