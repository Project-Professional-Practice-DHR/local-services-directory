const { User } = require('../models');

exports.registerDevice = async (req, res) => {
  try {
    const userId = req.user.id;
    const { token, deviceType } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Device token is required' });
    }
    
    // Get user record
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Initialize deviceTokens array if it doesn't exist or convert from database
    let deviceTokens = user.deviceTokens || [];
    if (typeof deviceTokens === 'string') {
      try {
        deviceTokens = JSON.parse(deviceTokens);
      } catch (e) {
        deviceTokens = [];
      }
    }
    
    // Add token only if it doesn't already exist
    if (!deviceTokens.includes(token)) {
      deviceTokens.push(token);
      
      // Store the device type if provided
      let devices = user.devices || [];
      if (typeof devices === 'string') {
        try {
          devices = JSON.parse(devices);
        } catch (e) {
          devices = [];
        }
      }
      
      if (deviceType) {
        devices.push({
          token,
          type: deviceType,
          registeredAt: new Date()
        });
      }
      
      // Update user record
      await user.update({
        deviceTokens,
        devices: deviceType ? devices : user.devices
      });
    }
    
    res.status(200).json({ message: 'Device registered successfully' });
  } catch (error) {
    console.error('Error registering device:', error);
    res.status(500).json({ message: 'Failed to register device', error: error.message });
  }
};

exports.unregisterDevice = async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Device token is required' });
    }
    
    // Get user record
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Process deviceTokens
    let deviceTokens = user.deviceTokens || [];
    if (typeof deviceTokens === 'string') {
      try {
        deviceTokens = JSON.parse(deviceTokens);
      } catch (e) {
        deviceTokens = [];
      }
    }
    
    // Process devices array
    let devices = user.devices || [];
    if (typeof devices === 'string') {
      try {
        devices = JSON.parse(devices);
      } catch (e) {
        devices = [];
      }
    }
    
    // Remove the token and device info
    const updatedTokens = deviceTokens.filter(t => t !== token);
    const updatedDevices = devices.filter(d => d.token !== token);
    
    // Update user record
    await user.update({
      deviceTokens: updatedTokens,
      devices: updatedDevices
    });
    
    res.status(200).json({ message: 'Device unregistered successfully' });
  } catch (error) {
    console.error('Error unregistering device:', error);
    res.status(500).json({ message: 'Failed to unregister device', error: error.message });
  }
};

exports.listUserDevices = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user record
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Process devices array
    let devices = user.devices || [];
    if (typeof devices === 'string') {
      try {
        devices = JSON.parse(devices);
      } catch (e) {
        devices = [];
      }
    }
    
    res.status(200).json({ 
      devices,
      deviceCount: devices.length
    });
  } catch (error) {
    console.error('Error listing devices:', error);
    res.status(500).json({ message: 'Failed to list devices', error: error.message });
  }
};