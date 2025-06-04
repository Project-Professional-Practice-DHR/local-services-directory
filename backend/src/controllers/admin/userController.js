// File: src/controllers/admin/userController.js

const { User, ServiceProviderProfile } = require('../../models');
const { Op } = require('sequelize');
const { sendEmail } = require('../../services/email.service');
const { createAuditLog } = require('../../services/auditService');

// Get users with pagination, filtering and sorting
exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Build filter object
    const whereClause = {};
    
    if (req.query.name) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${req.query.name}%` } },
        { lastName: { [Op.iLike]: `%${req.query.name}%` } }
      ];
    }
    
    if (req.query.email) {
      whereClause.email = { [Op.iLike]: `%${req.query.email}%` };
    }
    
    if (req.query.status) {
      whereClause.status = req.query.status;
    }
    
    if (req.query.role) {
      whereClause.role = req.query.role;
    }
    
    if (req.query.registeredAfter) {
      whereClause.createdAt = { [Op.gte]: new Date(req.query.registeredAfter) };
    }
    
    if (req.query.registeredBefore) {
      whereClause.createdAt = { 
        ...whereClause.createdAt, 
        [Op.lte]: new Date(req.query.registeredBefore) 
      };
    }
    
    // Determine sort order
    const sortField = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';
    const order = [[sortField, sortOrder]];
    
    // Execute query with pagination
    const { rows: users, count: total } = await User.findAndCountAll({
      where: whereClause,
      order,
      offset,
      limit,
      attributes: { exclude: ['password'] }
    });
    
    return res.status(200).json({
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.status(200).json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ message: 'Failed to fetch user details', error: error.message });
  }
};

// Update user status (suspend/ban)
exports.updateUserStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const userId = req.params.id;
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const previousStatus = user.status;
    user.status = status;
    user.statusReason = reason;
    user.statusUpdatedAt = new Date();
    user.statusUpdatedBy = req.user.id;
    
    await user.save();
    
    // Create audit log
    await createAuditLog({
      action: 'USER_STATUS_CHANGE',
      performedBy: req.user.id,
      targetUser: userId,
      details: {
        previousStatus,
        newStatus: status,
        reason
      }
    });
    
    // Send notification email to user
    await sendEmail({
      to: user.email,
      subject: `Your account status has been updated to ${status}`,
      template: 'statusChange',
      data: {
        name: `${user.firstName} ${user.lastName}`,
        status,
        reason
      }
    });
    
    return res.status(200).json({ 
      message: `User status successfully updated to ${status}`,
      user
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    return res.status(500).json({ message: 'Failed to update user status', error: error.message });
  }
};

// Verify service provider
exports.verifyProvider = async (req, res) => {
  try {
    const { verificationStatus, notes } = req.body;
    const providerId = req.params.id;
    
    const provider = await ServiceProviderProfile.findByPk(providerId, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });
    
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }
    
    const previousStatus = provider.verificationStatus;
    provider.verificationStatus = verificationStatus;
    provider.verificationNotes = notes;
    provider.verifiedAt = verificationStatus === 'verified' ? new Date() : null;
    provider.verifiedBy = verificationStatus === 'verified' ? req.user.id : null;
    
    await provider.save();
    
    // Create audit log
    await createAuditLog({
      action: 'PROVIDER_VERIFICATION',
      performedBy: req.user.id,
      targetUser: provider.user.id,
      details: {
        previousStatus,
        newStatus: verificationStatus,
        notes
      }
    });
    
    // Send notification email to provider
    await sendEmail({
      to: provider.user.email,
      subject: `Your service provider verification status: ${verificationStatus}`,
      template: 'providerVerification',
      data: {
        name: `${provider.user.firstName} ${provider.user.lastName}`,
        businessName: provider.businessName,
        status: verificationStatus,
        notes
      }
    });
    
    return res.status(200).json({ 
      message: `Provider verification status updated to ${verificationStatus}`,
      provider
    });
  } catch (error) {
    console.error('Error verifying provider:', error);
    return res.status(500).json({ message: 'Failed to update provider verification status', error: error.message });
  }
};