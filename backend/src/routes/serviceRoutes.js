const express = require('express');
const { 
  getServices, 
  createService, 
  updateService, 
  deleteService, 
  getProviderServices, 
  getService, 
  getMyServices 
} = require('../controllers/serviceController');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// Define your routes
router.post('/create', verifyToken, createService);
router.put('/update/:id', verifyToken, updateService);
router.delete('/delete/:id', verifyToken, deleteService);
router.get('/get', getService);
router.get('/provider/:providerId', verifyToken, getProviderServices);
router.get('/:id', getService);
router.get('/my-services', verifyToken, getMyServices);

// Export the router object
module.exports = router;