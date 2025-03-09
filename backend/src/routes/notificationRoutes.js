const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/auth');  // Import the verifyToken middleware

// Get user notifications
router.get('/', verifyToken, notificationController.getUserNotifications);

// Mark notification as read
router.patch('/:notificationId/read', verifyToken, notificationController.markAsRead);

// Mark all notifications as read
router.patch('/read-all', verifyToken, notificationController.markAllAsRead);

// Get unread notification count
router.get('/unread-count', verifyToken, notificationController.getUnreadCount);

module.exports = router;