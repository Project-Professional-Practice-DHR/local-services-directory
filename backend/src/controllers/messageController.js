const { Op } = require('sequelize');
const { Message, Conversation, User, Booking } = require('../models');
const { createNotification } = require('./notificationController');

exports.sendMessage = async (req, res) => {
  const transaction = await Message.sequelize.transaction();
  
  try {
    const { receiverId, content, booking_id, attachments = [] } = req.body;
    const sender_id = req.user.id;
    
    // Validate recipient exists
    const receiver = await User.findByPk(receiver_id);
    if (!receiver) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Recipient not found' });
    }
    
    // Validate booking if provided
    let booking = null;
    if (booking_id) {
      booking = await Booking.findByPk(booking_id);
      if (!booking) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Booking not found' });
      }
      
      // Ensure user is part of this booking
      const isProvider = booking.serviceId.providerId === sender_id;
      const isCustomer = booking.userId === sender_id;
      
      if (!isProvider && !isCustomer) {
        await transaction.rollback();
        return res.status(403).json({ message: 'Not authorized to message about this booking' });
      }
    }
    
    // Find or create conversation
    let conversation = await Conversation.findOne({
      where: {
        participants: { [Op.contains]: [sender_id, receiver_id] },
        ...(bookingId && { bookingId })
      },
      transaction
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [sender_id, receiver_id],
        unreadCount: { [receiverId]: 1 },
        ...(bookingId && { booking_id })
      }, { transaction });
    } else {
      // Update unread count for receiver
      const currentCount = conversation.unreadCount?.[receiver_id] || 0;
      conversation.unreadCount[receiver_id] = currentCount + 1;
    }

    // Create message
    const message = await Message.create({
      sender_id,
      receiver_id,
      content,
      ...(booking_id && { booking_id }),
      attachments
    }, { transaction });

    // Update conversation with last message
    conversation.lastMessage = {
      content,
      sender: sender_id,
      timestamp: new Date()
    };
    
    await conversation.save({ transaction });

    // Create notification for receiver
    await createNotification({
      userId: receiver_id,
      type: 'message',
      title: 'New Message',
      content: `You have a new message from ${req.user.name}`,
      data: {
        sender_id,
        conversationId: conversation.id,
        messageId: message.id
      }
    }, transaction);

    await transaction.commit();

    // Fetch sender details for response
    const populatedMessage = await Message.findByPk(message.id, {
      include: [{ model: User, as: 'sender', attributes: ['name', 'profileImage'] }]
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

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.findAll({
      where: { participants: { [Op.contains]: [userId] } },
      include: [
        { model: User, as: 'participants', attributes: ['id', 'name', 'profileImage'] },
        { model: Booking, as: 'booking', attributes: ['date', 'status'] }
      ],
      order: [['updatedAt', 'DESC']]
    });

    // Format the conversations for the client
    const formattedConversations = conversations.map(conv => {
      const otherParticipant = conv.participants.find(p => p.id !== userId);
      
      return {
        id: conv.id,
        participant: otherParticipant,
        lastMessage: conv.lastMessage,
        unreadCount: conv.unreadCount?.[userId] || 0,
        booking: conv.booking,
        updatedAt: conv.updatedAt
      };
    });

    res.status(200).json({ conversations: formattedConversations });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ message: 'Failed to get conversations', error: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Verify conversation exists and user is a participant
    const conversation = await Conversation.findOne({
      where: {
        id: conversationId,
        participants: { [Op.contains]: [userId] }
      }
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Get the other participant
    const otherParticipantId = conversation.participants.find(id => id !== userId);

    // Get messages for this conversation
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { sender_id: userId, receiverId: otherParticipantId },
          { sender_id: otherParticipantId, receiverId: userId }
        ]
      },
      include: [{ model: User, as: 'sender', attributes: ['name', 'profileImage'] }],
      order: [['createdAt', 'ASC']]
    });

    // Mark messages as read
    await Message.update(
      { is_read: true, readAt: new Date() },
      {
        where: {
          receiverId: userId,
          is_read: false
        }
      }
    );

    // Reset unread count for this user
    conversation.unreadCount[userId] = 0;
    await conversation.save();

    res.status(200).json({ messages });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ message: 'Failed to get messages', error: error.message });
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
    message.is_read = true;
    message.readAt = new Date();
    await message.save();

    // Update conversation unread count
    const conversation = await Conversation.findOne({
      where: { participants: { [Op.contains]: [userId, message.sender_id] } }
    });

    if (conversation) {
      const currentCount = conversation.unreadCount?.[userId] || 0;
      if (currentCount > 0) {
        conversation.unreadCount[userId] = currentCount - 1;
        await conversation.save();
      }
    }

    res.status(200).json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Failed to mark message as read', error: error.message });
  }
};