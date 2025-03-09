// File: src/middleware/auth.js

const jwt = require('jsonwebtoken');
const { User } = require('../models');
const sequelize = require('../../config/app.config').database.sequelize;

// Verify JWT token
exports.verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }
    
    const token = authHeader.split(' ')[1];

    // Verify the token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Find the user by ID, excluding the password field
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Access denied. Your account is ${user.status}`,
        reason: user.statusReason
      });
    }

    // Attach user to request
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid authentication token' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Authentication token expired' });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({ success: false, message: 'Authentication failed' });
  }
};

// Role-based authorization middleware
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }

    next();
  };
};

// Verify admin role
exports.verifyAdmin = [
  exports.verifyToken,
  (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
  }
];

// Verify provider role
exports.verifyProvider = [
  exports.verifyToken,
  (req, res, next) => {
    if (!['provider', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Provider access required' });
    }
    next();
  }
];