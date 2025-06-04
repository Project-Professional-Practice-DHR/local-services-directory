const { Notification, User } = require('../models');
const firebaseAdmin = require('../utils/firebase');
const { Op } = require('sequelize');

exports.createNotification = async (notificationData, transaction = null) => {
  try {
    // Create the notification
    const notification = await Notification.create(notificationData, 
      transaction ? { transaction } : {});
    
    // Send push notification if user has devices registered
    const user = await User.findByPk(notificationData.userId);
    if (user && user.deviceTokens && user.deviceTokens.length > 0) {
      await sendPushNotification(user.deviceTokens, notificationData);
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

const sendPushNotification = async (deviceTokens, notificationData) => {
  try {
    if (!firebaseAdmin) {
      console.warn('Firebase admin not initialized. Push notification not sent.');
      return;
    }
    
    const message = {
      notification: {
        title: notificationData.title,
        body: notificationData.content
      },
      data: {
        type: notificationData.type,
        ...(notificationData.data && { data: JSON.stringify(notificationData.data) })
      },
      tokens: deviceTokens
    };
    
    const response = await firebaseAdmin.messaging().sendMulticast(message);
    console.log(`${response.successCount} notifications sent successfully`);
    
    return response;
  } catch (error) {
    console.error('Error sending push notification:', error);
    // Don't throw error, just log it - we don't want to fail the transaction
    // if push notification fails
  }
};

exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const query = { userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }
    
    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: query,
      order: [['createdAt', 'DESC']],
      offset: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit)
    });
    
    res.status(200).json({
      notifications,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ message: 'Failed to get notifications', error: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    
    const notification = await Notification.findOne({
      where: { 
        id: notificationId, 
        userId 
      }
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    notification.isRead = true;
    await notification.save();
    
    res.status(200).json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read', error: error.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [updatedRows] = await Notification.update(
      { isRead: true },
      { 
        where: { 
          userId, 
          isRead: false 
        } 
      }
    );
    
    res.status(200).json({
      message: 'All notifications marked as read',
      count: updatedRows
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Failed to mark notifications as read', error: error.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const count = await Notification.count({
      where: {
        userId,
        isRead: false
      }
    });
    
    res.status(200).json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Failed to get unread count', error: error.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    
    const notification = await Notification.findOne({
      where: { 
        id: notificationId, 
        userId 
      }
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    await notification.destroy();
    
    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Failed to delete notification', error: error.message });
  }
};