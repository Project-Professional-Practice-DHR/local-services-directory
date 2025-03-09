// File: src/controllers/admin/userController.js

const User = require('../../models/User');
const Provider = require('../../models/ServiceProvider');
const { sendEmail } = require('../../services/email.service');
const { createAuditLog } = require('../../services/auditService');

// Get users with pagination, filtering and sorting
exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    
    if (req.query.name) {
      filter.name = { $regex: req.query.name, $options: 'i' };
    }
    
    if (req.query.email) {
      filter.email = { $regex: req.query.email, $options: 'i' };
    }
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.role) {
      filter.role = req.query.role;
    }
    
    if (req.query.registeredAfter) {
      filter.createdAt = { $gte: new Date(req.query.registeredAfter) };
    }
    
    if (req.query.registeredBefore) {
      filter.createdAt = { 
        ...filter.createdAt, 
        $lte: new Date(req.query.registeredBefore) 
      };
    }
    
    // Determine sort order
    const sortField = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortOrder };
    
    // Execute query with pagination
    const users = await User.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments(filter);
    
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
    return res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.status(200).json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ message: 'Failed to fetch user details' });
  }
};

// Update user status (suspend/ban)
exports.updateUserStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const userId = req.params.id;
    
    const user = await User.findById(userId);
    
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
        name: user.name,
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
    return res.status(500).json({ message: 'Failed to update user status' });
  }
};

// Verify service provider
exports.verifyProvider = async (req, res) => {
  try {
    const { verificationStatus, notes } = req.body;
    const providerId = req.params.id;
    
    const provider = await Provider.findById(providerId).populate('userId');
    
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
      targetUser: provider.userId._id,
      details: {
        previousStatus,
        newStatus: verificationStatus,
        notes
      }
    });
    
    // Send notification email to provider
    await sendEmail({
      to: provider.userId.email,
      subject: `Your service provider verification status: ${verificationStatus}`,
      template: 'providerVerification',
      data: {
        name: provider.userId.name,
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
    return res.status(500).json({ message: 'Failed to update provider verification status' });
  }
};