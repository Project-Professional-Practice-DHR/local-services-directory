const User = require('../models/User');

exports.registerDevice = async (req, res) => {
  try {
    const userId = req.user._id;
    const { token, deviceType } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Device token is required' });
    }
    
    // Update user document with the device token
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Initialize deviceTokens array if it doesn't exist
    if (!user.deviceTokens) {
      user.deviceTokens = [];
    }
    
    // Add token only if it doesn't already exist
    if (!user.deviceTokens.includes(token)) {
      user.deviceTokens.push(token);
      
      // Store the device type if provided
      if (deviceType) {
        if (!user.devices) {
          user.devices = [];
        }
        
        user.devices.push({
          token,
          type: deviceType,
          registeredAt: new Date()
        });
      }
      
      await user.save();
    }
    
    res.status(200).json({ message: 'Device registered successfully' });
  } catch (error) {
    console.error('Error registering device:', error);
    res.status(500).json({ message: 'Failed to register device', error: error.message });
  }
};

exports.unregisterDevice = async (req, res) => {
  try {
    const userId = req.user._id;
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Device token is required' });
    }
    
    // Update user document to remove the device token
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.deviceTokens) {
      user.deviceTokens = user.deviceTokens.filter(t => t !== token);
    }
    
    if (user.devices) {
      user.devices = user.devices.filter(d => d.token !== token);
    }
    
    await user.save();
    
    res.status(200).json({ message: 'Device unregistered successfully' });
  } catch (error) {
    console.error('Error unregistering device:', error);
    res.status(500).json({ message: 'Failed to unregister device', error: error.message });
  }
};