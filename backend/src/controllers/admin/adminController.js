// src/controllers/admin/adminController.js
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

/**
 * Get dashboard statistics for admin overview
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDashboardStats = async (req, res) => {
  try {
    // Get user counts by role
    const totalUsers = await User.count();
    const totalCustomers = await User.count({ where: { role: 'customer' } });
    const totalProviders = await User.count({ where: { role: 'provider' } });
    const totalAdmins = await User.count({ where: { role: 'admin' } });
    
    // Get verified providers count
    const verifiedProviders = await User.count({ 
      where: { 
        role: 'provider', 
        isProviderVerified: true 
      } 
    });
    
    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentRegistrations = await User.count({
      where: {
        createdAt: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalCustomers,
        totalProviders,
        totalAdmins,
        verifiedProviders,
        recentRegistrations,
        unverifiedProviders: totalProviders - verifiedProviders
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all users with filtering and pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllUsers = async (req, res) => {
  try {
    const { 
      search, 
      role, 
      verified, 
      status,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = 1, 
      limit = 10 
    } = req.query;
    
    // Build query conditions
    const whereConditions = {};
    
    if (search) {
      whereConditions[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (role && role !== 'all') {
      whereConditions.role = role;
    }
    
    if (verified !== undefined && verified !== 'all') {
      whereConditions.isProviderVerified = verified === 'true';
    }
    
    if (status && status !== 'all') {
      whereConditions.isActive = status === 'active';
    }
    
    // Define pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const users = await User.findAndCountAll({
      where: whereConditions,
      attributes: { exclude: ['password'] },
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: offset
    });
    
    res.status(200).json({
      success: true,
      users: users.rows,
      pagination: {
        total: users.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(users.count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get user by ID (admin access)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Create a new user (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createUser = async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      role, 
      phone, 
      address, 
      city, 
      state, 
      zipCode, 
      country,
      bio 
    } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: role || 'customer',
      phone,
      address,
      city,
      state,
      zipCode,
      country,
      bio,
      isActive: true
    });
    
    // Create sanitized response
    const userResponse = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      city: user.city,
      state: user.state,
      zipCode: user.zipCode,
      country: user.country,
      bio: user.bio,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update user information (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      firstName, 
      lastName, 
      email, 
      role, 
      phone, 
      address, 
      city, 
      state, 
      zipCode, 
      country,
      bio,
      isActive,
      isProviderVerified
    } = req.body;
    
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }
    
    // Update user fields
    user.firstName = firstName !== undefined ? firstName : user.firstName;
    user.lastName = lastName !== undefined ? lastName : user.lastName;
    user.email = email !== undefined ? email : user.email;
    user.role = role !== undefined ? role : user.role;
    user.phone = phone !== undefined ? phone : user.phone;
    user.address = address !== undefined ? address : user.address;
    user.city = city !== undefined ? city : user.city;
    user.state = state !== undefined ? state : user.state;
    user.zipCode = zipCode !== undefined ? zipCode : user.zipCode;
    user.country = country !== undefined ? country : user.country;
    user.bio = bio !== undefined ? bio : user.bio;
    user.isActive = isActive !== undefined ? isActive : user.isActive;
    user.isProviderVerified = isProviderVerified !== undefined ? isProviderVerified : user.isProviderVerified;
    
    await user.save();
    
    // Create sanitized response
    const userResponse = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      city: user.city,
      state: user.state,
      zipCode: user.zipCode,
      country: user.country,
      bio: user.bio,
      isActive: user.isActive,
      isProviderVerified: user.isProviderVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete user (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Prevent admin from deleting themselves
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }
    
    await user.destroy();
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Toggle user active status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Prevent admin from deactivating themselves
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own account status'
      });
    }
    
    user.isActive = !user.isActive;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Verify or unverify a provider
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const toggleProviderVerification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const provider = await User.findOne({
      where: {
        id,
        role: 'provider'
      },
      attributes: { exclude: ['password'] }
    });
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }
    
    provider.isProviderVerified = !provider.isProviderVerified;
    await provider.save();
    
    res.status(200).json({
      success: true,
      message: `Provider ${provider.isProviderVerified ? 'verified' : 'unverified'} successfully`,
      provider
    });
  } catch (error) {
    console.error('Error toggling provider verification:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating provider verification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Reset user password (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get system activity logs (placeholder)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    // This would typically fetch from an activity logs table
    // For now, returning recent user activities as placeholder
    const recentUsers = await User.findAll({
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'createdAt', 'updatedAt'],
      order: [['updatedAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });
    
    res.status(200).json({
      success: true,
      logs: recentUsers,
      message: 'Activity logs retrieved (showing recent user updates as placeholder)'
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving activity logs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Export all controller methods
module.exports = {
  getDashboardStats,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  toggleProviderVerification,
  resetUserPassword,
  getActivityLogs
};