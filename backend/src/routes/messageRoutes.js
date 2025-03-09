const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { verifyToken } = require('../middleware/auth');  // Import the verifyToken middleware

// Send a message
router.post('/', verifyToken, messageController.sendMessage);

// Get all conversations
router.get('/conversations', verifyToken, messageController.getConversations);

// Get messages for a conversation
router.get('/conversations/:conversationId', verifyToken, messageController.getMessages);

// Mark message as read
router.patch('/:messageId/read', verifyToken, messageController.markAsRead);

module.exports = router;