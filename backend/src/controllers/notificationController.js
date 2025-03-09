const Notification = require('../models/Notification');
const User = require('../models/User');
const firebaseAdmin = require('../utils/firebase');

exports.createNotification = async (notificationData, session = null) => {
  try {
    const notification = new Notification(notificationData);
    
    if (session) {
      await notification.save({ session });
    } else {
      await notification.save();
    }
    
    // Send push notification if user has devices registered
    const user = await User.findById(notificationData.userId);
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
    const userId = req.user._id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const query = { userId };
    if (unreadOnly === 'true') {
      query.is_read = false;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));
    
    const total = await Notification.countDocuments(query);
    
    res.status(200).json({
      notifications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
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
    const userId = req.user._id;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { is_read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.status(200).json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read', error: error.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const result = await Notification.updateMany(
      { userId, is_read: false },
      { is_read: true }
    );
    
    res.status(200).json({
      message: 'All notifications marked as read',
      count: result.nModified
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Failed to mark notifications as read', error: error.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const count = await Notification.countDocuments({
      userId,
      is_read: false
    });
    
    res.status(200).json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Failed to get unread count', error: error.message });
  }
};