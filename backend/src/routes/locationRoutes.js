const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { verifyToken } = require('../middleware/auth');  // Import the verifyToken middleware

// Update user's location
router.post('/user', verifyToken, locationController.updateUserLocation);

// Validate an address
router.post('/validate', locationController.validateAddress);

// Reverse geocode coordinates to address
router.get('/reverse', locationController.reverseGeocode);

// Calculate distance between two points
router.post('/distance', locationController.calculateDistance);

// Find providers near a location
router.get('/nearby', locationController.findNearbyProviders);

module.exports = router;