const { User } = require('../../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

// You'll need to import your other models for complete stats
// Uncomment and adjust these imports based on your actual model structure
// const { Booking, Category, Report, Transaction } = require('../../models');

/**
 * Admin login with JWT token generation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const login = async (req, res) => {
  try {
    console.log('🔐 Admin login attempt started');
    console.log('📝 Request body:', { 
      username: req.body.username, 
      password: req.body.password ? '[PROVIDED]' : '[MISSING]' 
    });

    const { username, password } = req.body;

    if (!username || !password) {
      console.log('❌ Missing credentials');
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    console.log('🔍 Looking for admin user with email:', username);
    
    const admin = await User.findOne({
      where: {
        email: username,
        role: 'admin',
        status: 'active'
      }
    });

    console.log('👤 Admin found:', admin ? 'YES' : 'NO');
    if (admin) {
      console.log('📋 Admin details:', {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive
      });
    }

    if (!admin) {
      console.log('❌ No admin user found with provided credentials');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('🔑 Checking password...');
    const isPasswordValid = await admin.comparePassword(password);
    console.log('🔑 Password valid:', isPasswordValid ? 'YES' : 'NO');
    
    if (!isPasswordValid) {
      console.log('❌ Password validation failed');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const tokenPayload = {
      id: admin.id,
      email: admin.email,
      role: admin.role
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    const adminResponse = {
      id: admin.id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      role: admin.role
    };

    console.log('✅ Login successful for admin:', admin.email);
    console.log('🎫 Token generated successfully');

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: token,
      user: adminResponse,
      admin: adminResponse
    });

  } catch (error) {
    console.error('💥 Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get dashboard statistics for admin overview
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDashboardStats = async (req, res) => {
  try {
    console.log('📊 Fetching dashboard statistics...');

    // Basic user statistics
    const totalUsers = await User.count();
    const totalCustomers = await User.count({ where: { role: 'customer' } });
    const totalProviders = await User.count({ where: { role: 'provider' } });
    const totalAdmins = await User.count({ where: { role: 'admin' } });
    
    // Get verified providers count
    const verifiedProviders = await User.count({ 
      where: { 
        role: 'provider', 
        isVerified: true 
      } 
    });

    // Get unverified providers (pending approvals)
    const pendingApprovals = await User.count({ 
      where: { 
        role: 'provider', 
        isVerified: false 
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

    // TODO: Replace these with actual model queries when you have the models
    // For now, providing mock data that matches your frontend expectations
    
    let totalBookings = 0;
    let flaggedContent = 0;
    let revenue = 0;

    // Uncomment and modify these when you have the actual models:
    /*
    // Get booking statistics
    totalBookings = await Booking.count();
    
    // Get flagged content count
    flaggedContent = await Report.count({
      where: {
        status: 'pending'
      }
    });
    
    // Calculate revenue
    const revenueResult = await Transaction.sum('amount', {
      where: {
        status: 'completed',
        type: 'payment'
      }
    });
    revenue = revenueResult || 0;
    */

    // For demonstration, you can use some mock calculations based on existing data
    // Remove these when you implement actual booking/transaction models
    totalBookings = Math.floor(totalProviders * 2.5); // Mock: assume each provider has ~2.5 bookings on average
    flaggedContent = Math.floor(totalUsers * 0.02); // Mock: assume 2% of users have flagged content

    const stats = {
      totalUsers,
      totalProviders,
      totalBookings,
      pendingApprovals,
      flaggedContent,
      revenue: Math.round(revenue * 100) / 100, // Round to 2 decimal places
      // Additional stats that might be useful
      totalCustomers,
      totalAdmins,
      verifiedProviders,
      recentRegistrations,
      unverifiedProviders: totalProviders - verifiedProviders
    };

    console.log('✅ Dashboard stats calculated:', stats);

    res.status(200).json({
      success: true,
      stats: stats,
      message: 'Dashboard statistics retrieved successfully'
    });

  } catch (error) {
    console.error('💥 Error fetching dashboard stats:', error);
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
      whereConditions.isVerified = verified === 'true';
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
      isVerified
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
    user.isVerified = isVerified !== undefined ? isVerified : user.isVerified;
    
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
      isVerified: user.isVerified,
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
    
    provider.isVerified = !provider.isVerified;
    await provider.save();
    
    res.status(200).json({
      success: true,
      message: `Provider ${provider.isVerified ? 'verified' : 'unverified'} successfully`,
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
  login,
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