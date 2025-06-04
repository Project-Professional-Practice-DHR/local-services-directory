// File: src/controllers/admin/moderationController.js

const { FlaggedContent, Review, Service, User, sequelize } = require('../../models');
const { Op, fn, col } = require('sequelize');
const { createAuditLog } = require('../../services/auditService');
const { sendEmail } = require('../../services/email.service');
const { moderateText } = require('../../services/moderationService');

// Get flagged content with filters
exports.getFlaggedContent = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      contentType,
      severity,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build filter object
    const whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (contentType) {
      whereClause.contentType = contentType;
    }
    
    if (severity) {
      whereClause.severity = severity;
    }
    
    // Sort options
    const order = [[sortBy, sortOrder === 'asc' ? 'ASC' : 'DESC']];
    
    // Execute query with pagination
    const { rows: flaggedContent, count: total } = await FlaggedContent.findAndCountAll({
      where: whereClause,
      order,
      offset,
      limit: parseInt(limit),
      include: [
        {
          model: User,
          as: 'reportedBy',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'contentAuthor',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });
    
    return res.status(200).json({
      flaggedContent,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching flagged content:', error);
    return res.status(500).json({ message: 'Failed to fetch flagged content', error: error.message });
  }
};

// Take action on flagged content
exports.moderateContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason, notifyUser } = req.body;
    
    const flaggedContent = await FlaggedContent.findByPk(id, {
      include: [
        {
          model: User,
          as: 'contentAuthor',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });
    
    if (!flaggedContent) {
      return res.status(404).json({ message: 'Flagged content not found' });
    }
    
    // Update flagged content status
    flaggedContent.status = action === 'approve' ? 'approved' : 'removed';
    flaggedContent.moderationNotes = reason;
    flaggedContent.moderatedAt = new Date();
    flaggedContent.moderatedbyId = req.user.id;
    
    await flaggedContent.save();
    
    // Take action on the actual content
    let contentActionResult;
    
    switch (flaggedContent.contentType) {
      case 'review':
        contentActionResult = await handleReviewModeration(
          flaggedContent.contentId,
          action,
          reason
        );
        break;
      case 'service':
        contentActionResult = await handleServiceModeration(
          flaggedContent.contentId,
          action,
          reason
        );
        break;
      case 'user':
        contentActionResult = await handleUserModeration(
          flaggedContent.contentId,
          action,
          reason
        );
        break;
      // Add more content types as needed
    }
    
    // Create audit log
    await createAuditLog({
      action: `CONTENT_${action.toUpperCase()}`,
      performedBy: req.user.id,
      targetUser: flaggedContent.contentAuthor?.id,
      details: {
        contentType: flaggedContent.contentType,
        contentId: flaggedContent.contentId,
        reason,
        flagId: flaggedContent.id
      }
    });
    
    // Notify user if requested
    if (notifyUser && flaggedContent.contentAuthor) {
      await sendEmail({
        to: flaggedContent.contentAuthor.email,
        subject: `Your content has been ${action === 'approve' ? 'approved' : 'removed'}`,
        template: 'contentModeration',
        data: {
          name: `${flaggedContent.contentAuthor.firstName} ${flaggedContent.contentAuthor.lastName}`,
          contentType: flaggedContent.contentType,
          action: action === 'approve' ? 'approved' : 'removed',
          reason,
          contentSummary: flaggedContent.contentSummary
        }
      });
    }
    
    return res.status(200).json({
      message: `Content has been ${action === 'approve' ? 'approved' : 'removed'} successfully`,
      flaggedContent,
      contentActionResult
    });
  } catch (error) {
    console.error('Error moderating content:', error);
    return res.status(500).json({ message: 'Failed to moderate content', error: error.message });
  }
};

// Handle review moderation
async function handleReviewModeration(reviewId, action, reason) {
  const review = await Review.findByPk(reviewId);
  
  if (!review) {
    return { success: false, message: 'Review not found' };
  }
  
  if (action === 'remove') {
    review.status = 'removed';
    review.moderationNotes = reason;
    await review.save();
    return { success: true, message: 'Review removed' };
  } else {
    review.status = 'approved';
    review.moderationNotes = reason;
    await review.save();
    return { success: true, message: 'Review approved' };
  }
}

// Handle service moderation
async function handleServiceModeration(serviceId, action, reason) {
  const service = await Service.findByPk(serviceId);
  
  if (!service) {
    return { success: false, message: 'Service not found' };
  }
  
  if (action === 'remove') {
    service.status = 'suspended';
    service.moderationNotes = reason;
    await service.save();
    return { success: true, message: 'Service suspended' };
  } else {
    service.status = 'active';
    service.moderationNotes = reason;
    await service.save();
    return { success: true, message: 'Service approved' };
  }
}

// Handle user moderation
async function handleUserModeration(userId, action, reason) {
  const user = await User.findByPk(userId);
  
  if (!user) {
    return { success: false, message: 'User not found' };
  }
  
  if (action === 'remove') {
    user.status = 'suspended';
    user.statusReason = reason;
    user.statusUpdatedAt = new Date();
    await user.save();
    return { success: true, message: 'User suspended' };
  } else {
    user.status = 'active';
    user.statusReason = reason;
    user.statusUpdatedAt = new Date();
    await user.save();
    return { success: true, message: 'User approved' };
  }
}

// Get moderation statistics
exports.getModerationStats = async (req, res) => {
  try {
    // Get counts by status
    const statusCounts = await FlaggedContent.findAll({
      attributes: [
        ['status', 'status'],
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['status']
    });
    
    // Get counts by content type
    const contentTypeCounts = await FlaggedContent.findAll({
      attributes: [
        ['contentType', 'contentType'],
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['contentType']
    });
    
    // Get counts by severity
    const severityCounts = await FlaggedContent.findAll({
      attributes: [
        ['severity', 'severity'],
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['severity']
    });
    
    // Get average resolution time
    const resolutionTimeData = await FlaggedContent.findAll({
      attributes: [
        [fn('AVG', sequelize.literal(`EXTRACT(EPOCH FROM ("moderatedAt" - "createdAt")) / 3600`)), 'averageTimeHours'],
        [fn('MIN', sequelize.literal(`EXTRACT(EPOCH FROM ("moderatedAt" - "createdAt")) / 3600`)), 'minTimeHours'],
        [fn('MAX', sequelize.literal(`EXTRACT(EPOCH FROM ("moderatedAt" - "createdAt")) / 3600`)), 'maxTimeHours']
      ],
      where: {
        status: { [Op.in]: ['approved', 'removed'] },
        moderatedAt: { [Op.not]: null }
      }
    });
    
    const resolutionTime = resolutionTimeData[0] || {
      averageTimeHours: 0,
      minTimeHours: 0,
      maxTimeHours: 0
    };
    
    // Get pending count
    const pendingCount = await FlaggedContent.count({
      where: { status: 'pending' }
    });
    
    return res.status(200).json({
      statusCounts,
      contentTypeCounts,
      severityCounts,
      resolutionTime,
      pendingCount
    });
  } catch (error) {
    console.error('Error fetching moderation stats:', error);
    return res.status(500).json({ message: 'Failed to fetch moderation statistics', error: error.message });
  }
};