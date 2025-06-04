const { Op } = require('sequelize');
const { Message, User, Booking, sequelize } = require('../models');
const { createNotification } = require('./notificationController');

exports.sendMessage = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { receiverId, content, bookingId, attachments = [] } = req.body;
    const senderId = req.user.id;
    
    // Validate recipient exists
    const receiver = await User.findByPk(receiverId);
    if (!receiver) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Recipient not found' });
    }
    
    // Validate booking if provided
    if (bookingId) {
      const booking = await Booking.findByPk(bookingId, {
        include: [{
          model: User,
          as: 'provider'
        }]
      });
      
      if (!booking) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Booking not found' });
      }
      
      // Ensure user is part of this booking
      const isProvider = booking.provider.id === senderId;
      const isCustomer = booking.userId === senderId;
      
      if (!isProvider && !isCustomer) {
        await transaction.rollback();
        return res.status(403).json({ message: 'Not authorized to message about this booking' });
      }
    }
    
    // Create message
    const message = await Message.create({
      senderId,
      receiverId,
      content,
      bookingId,
      isRead: false,
      attachments: attachments
    }, { transaction });

    // Create notification for receiver
    await createNotification({
      userId: receiverId,
      type: 'message',
      title: 'New Message',
      content: `You have a new message from ${req.user.firstName} ${req.user.lastName}`,
      data: {
        senderId,
        messageId: message.id
      }
    }, transaction);

    await transaction.commit();

    // Fetch sender details for response
    const populatedMessage = await Message.findByPk(message.id, {
      include: [{ 
        model: User, 
        as: 'sender', 
        attributes: ['id', 'firstName', 'lastName'] 
      }]
    });

    res.status(201).json({
      message: 'Message sent successfully',
      data: populatedMessage
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
};

exports.getMessagesBetweenUsers = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user.id;

    // Get messages between the two users
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ]
      },
      include: [
        { 
          model: User, 
          as: 'sender', 
          attributes: ['id', 'firstName', 'lastName'] 
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    // Mark unread messages as read
    await Message.update(
      { 
        isRead: true, 
        readAt: new Date() 
      },
      {
        where: {
          receiverId: userId,
          senderId: otherUserId,
          isRead: false
        }
      }
    );

    res.status(200).json({ messages });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ message: 'Failed to get messages', error: error.message });
  }
};

exports.getMessagesForBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    // Verify booking exists and user is a participant
    const booking = await Booking.findByPk(bookingId, {
      include: [
        { model: User, as: 'customer' },
        { model: User, as: 'provider' }
      ]
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is part of this booking
    const isProvider = booking.provider.id === userId;
    const isCustomer = booking.customer.id === userId;
    
    if (!isProvider && !isCustomer) {
      return res.status(403).json({ message: 'Not authorized to view messages for this booking' });
    }

    // Get all messages for this booking
    const messages = await Message.findAll({
      where: { bookingId },
      include: [
        { 
          model: User, 
          as: 'sender', 
          attributes: ['id', 'firstName', 'lastName'] 
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    // Mark any unread messages as read
    await Message.update(
      { 
        isRead: true, 
        readAt: new Date() 
      },
      {
        where: {
          bookingId,
          receiverId: userId,
          isRead: false
        }
      }
    );

    res.status(200).json({ messages });
  } catch (error) {
    console.error('Error getting booking messages:', error);
    res.status(500).json({ message: 'Failed to get booking messages', error: error.message });
  }
};

exports.getRecentConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get unique users who have messaged with this user
    const conversations = await Message.findAll({
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('senderId')), 'userId'],
        [sequelize.fn('MAX', sequelize.col('createdAt')), 'lastMessageAt']
      ],
      where: {
        [Op.or]: [
          { senderId: { [Op.ne]: userId }, receiverId: userId },
          { senderId: userId }
        ]
      },
      group: ['senderId'],
      order: [[sequelize.fn('MAX', sequelize.col('createdAt')), 'DESC']],
      raw: true
    });

    // Get the most recent message and user details for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.userId === userId 
          ? (await Message.findOne({
              where: { senderId: userId },
              order: [['createdAt', 'DESC']],
              attributes: ['receiverId'],
              raw: true
            })).receiverId
          : conv.userId;

        const lastMessage = await Message.findOne({
          where: {
            [Op.or]: [
              { senderId: userId, receiverId: otherUserId },
              { senderId: otherUserId, receiverId: userId }
            ]
          },
          order: [['createdAt', 'DESC']],
          raw: true
        });

        const otherUser = await User.findByPk(otherUserId, {
          attributes: ['id', 'firstName', 'lastName'],
          raw: true
        });

        const unreadCount = await Message.count({
          where: {
            senderId: otherUserId,
            receiverId: userId,
            isRead: false
          }
        });

        return {
          user: otherUser,
          lastMessage,
          unreadCount
        };
      })
    );

    res.status(200).json({ conversations: conversationsWithDetails });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ message: 'Failed to get conversations', error: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findOne({
      where: { id: messageId, receiverId: userId }
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Mark as read
    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    res.status(200).json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Failed to mark message as read', error: error.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const { senderId } = req.body;
    const userId = req.user.id;

    if (!senderId) {
      return res.status(400).json({ message: 'Sender ID is required' });
    }

    // Mark all messages from this sender as read
    const result = await Message.update(
      { 
        isRead: true, 
        readAt: new Date() 
      },
      {
        where: {
          senderId,
          receiverId: userId,
          isRead: false
        }
      }
    );

    res.status(200).json({ 
      message: 'All messages marked as read',
      count: result[0]
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Failed to mark messages as read', error: error.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    // Find the message
    const message = await Message.findOne({
      where: { 
        id: messageId,
        senderId: userId // Can only delete messages you sent
      }
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found or you are not authorized to delete it' });
    }

    // Delete the message
    await message.destroy();

    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Failed to delete message', error: error.message });
  }
};