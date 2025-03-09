const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const { verifyToken } = require('../middleware/auth');

router.post('/register', verifyToken, deviceController.registerDevice);
router.post('/unregister', verifyToken, deviceController.unregisterDevice);

module.exports = router;