// src/controllers/deviceTokenController.js
const { DeviceToken, User } = require('../models');

exports.registerDeviceToken = async (req, res) => {
  try {
    const { token, deviceType, deviceInfo } = req.body;
    const userId = req.user.id;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Device token is required'
      });
    }

    // Check if token already exists
    const existingToken = await DeviceToken.findOne({
      where: { token, userId }
    });

    if (existingToken) {
      return res.status(200).json({
        success: true,
        message: 'Device token already registered'
      });
    }

    // Create new device token
    await DeviceToken.create({
      userId,
      token,
      deviceType: deviceType || 'unknown',
      deviceInfo: deviceInfo || {}
    });

    // Also update User model's deviceTokens array
    const user = await User.findByPk(userId);
    if (user) {
      if (!user.deviceTokens) {
        user.deviceTokens = [];
      }
      user.deviceTokens.push(token);
      await user.save();
    }

    res.status(201).json({
      success: true,
      message: 'Device token registered successfully'
    });
  } catch (error) {
    console.error('Register device token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering device token',
      error: error.message
    });
  }
};

exports.unregisterDeviceToken = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Device token is required'
      });
    }

    // Delete token
    await DeviceToken.destroy({
      where: { token, userId }
    });

    // Also update User model's deviceTokens array
    const user = await User.findByPk(userId);
    if (user && user.deviceTokens) {
      user.deviceTokens = user.deviceTokens.filter(t => t !== token);
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Device token unregistered successfully'
    });
  } catch (error) {
    console.error('Unregister device token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unregistering device token',
      error: error.message
    });
  }
};