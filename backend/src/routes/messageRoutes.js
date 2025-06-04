const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { verifyToken } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Messaging endpoints
 */

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: Send a message
 *     description: Send a message to another user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiverId
 *               - content
 *             properties:
 *               receiverId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the message recipient
 *               content:
 *                 type: string
 *                 description: Message content
 *               bookingId:
 *                 type: string
 *                 format: uuid
 *                 description: Related booking ID (optional)
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Message attachments (optional)
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to message about this booking
 *       404:
 *         description: Recipient or booking not found
 *       500:
 *         description: Server error
 */
router.post('/', verifyToken, messageController.sendMessage);

/**
 * @swagger
 * /api/messages/conversations:
 *   get:
 *     summary: Get recent conversations
 *     description: Get list of recent conversations for the authenticated user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of recent conversations
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/conversations', verifyToken, messageController.getRecentConversations);

/**
 * @swagger
 * /api/messages/conversations/{otherUserId}:
 *   get:
 *     summary: Get messages between users
 *     description: Get all messages between the authenticated user and another user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: otherUserId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the other user in the conversation
 *     responses:
 *       200:
 *         description: List of messages
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/conversations/:otherUserId', verifyToken, messageController.getMessagesBetweenUsers);

/**
 * @swagger
 * /api/messages/{messageId}/read:
 *   patch:
 *     summary: Mark message as read
 *     description: Mark a message as read
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the message to mark as read
 *     responses:
 *       200:
 *         description: Message marked as read
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Message not found
 *       500:
 *         description: Server error
 */
router.patch('/:messageId/read', verifyToken, messageController.markAsRead);

/**
 * @swagger
 * /api/messages/booking/{bookingId}:
 *   get:
 *     summary: Get messages for a booking
 *     description: Get all messages related to a specific booking
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the booking
 *     responses:
 *       200:
 *         description: List of messages for the booking
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to view messages for this booking
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
// Add this endpoint if the controller has the method
if (messageController.getMessagesForBooking) {
  router.get('/booking/:bookingId', verifyToken, messageController.getMessagesForBooking);
}

/**
 * @swagger
 * /api/messages/mark-all-read:
 *   patch:
 *     summary: Mark all messages as read
 *     description: Mark all unread messages from a specific sender as read
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - senderId
 *             properties:
 *               senderId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the message sender
 *     responses:
 *       200:
 *         description: All messages marked as read
 *       400:
 *         description: Missing senderId
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Add this endpoint if the controller has the method
if (messageController.markAllAsRead) {
  router.patch('/mark-all-read', verifyToken, messageController.markAllAsRead);
}

module.exports = router;