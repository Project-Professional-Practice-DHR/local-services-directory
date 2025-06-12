// src/controllers/admin/userController.js
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

/**
 * Get the authenticated user's profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
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
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update the authenticated user's profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, address, city, state, zipCode, country, bio } = req.body;
    
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user fields
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phone = phone || user.phone;
    user.address = address || user.address;
    user.city = city || user.city;
    user.state = state || user.state;
    user.zipCode = zipCode || user.zipCode;
    user.country = country || user.country;
    user.bio = bio || user.bio;

    await user.save();

    // Create a sanitized user object without password
    const userResponse = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      city: user.city,
      state: user.state,
      zipCode: user.zipCode,
      country: user.country,
      bio: user.bio,
      role: user.role,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Change the authenticated user's password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get a list of service providers with optional filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProviders = async (req, res) => {
  try {
    const { search, category, verified, rating, page = 1, limit = 10 } = req.query;
    
    // Build query conditions
    const whereConditions = {
      role: 'provider'
    };
    
    if (search) {
      whereConditions[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (verified !== undefined) {
      whereConditions.isVerified = verified === 'true';
    }
    
    // Define pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const providers = await User.findAndCountAll({
      where: whereConditions,
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset: offset
    });
    
    // If category filtering is required, we'll need to join with services table
    // This is simplified and would need adjustment based on your data model
    
    res.status(200).json({
      success: true,
      providers: providers.rows,
      pagination: {
        total: providers.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(providers.count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving providers',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get detailed information about a specific provider
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProviderById = async (req, res) => {
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
    
    res.status(200).json({
      success: true,
      provider
    });
  } catch (error) {
    console.error('Error fetching provider details:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving provider details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get detailed information about a specific customer
 * Only accessible by providers or admins
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const customer = await User.findOne({
      where: {
        id,
        role: 'customer'
      },
      attributes: { exclude: ['password'] }
    });
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    res.status(200).json({
      success: true,
      customer
    });
  } catch (error) {
    console.error('Error fetching customer details:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving customer details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Export the controller methods before defining or importing anything else
// This is key to breaking circular dependencies
module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getProviders,
  getProviderById,
  getCustomerById
};