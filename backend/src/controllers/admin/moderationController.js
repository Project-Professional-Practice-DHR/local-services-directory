// File: src/controllers/admin/moderationController.js

const FlaggedContent = require('../../models/FlaggedContent');
const Review = require('../../models/Review');
const Service = require('../../models/Service');
const User = require('../../models/User');
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
      content_type,
      severity,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build filter object
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (content_type) {
      filter.content_type = content_type;
    }
    
    if (severity) {
      filter.severity = severity;
    }
    
    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Execute query with pagination
    const flaggedContent = await FlaggedContent.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('reportedBy', 'name email')
      .populate('contentAuthor', 'name email');
    
    const total = await FlaggedContent.countDocuments(filter);
    
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
    return res.status(500).json({ message: 'Failed to fetch flagged content' });
  }
};

// Take action on flagged content
exports.moderateContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason, notifyUser } = req.body;
    
    const flaggedContent = await FlaggedContent.findById(id)
      .populate('contentAuthor', 'name email');
    
    if (!flaggedContent) {
      return res.status(404).json({ message: 'Flagged content not found' });
    }
    
    // Update flagged content status
    flaggedContent.status = action === 'approve' ? 'approved' : 'removed';
    flaggedContent.moderationNotes = reason;
    flaggedContent.moderatedAt = new Date();
    flaggedContent.moderatedBy = req.user.id;
    
    await flaggedContent.save();
    
    // Take action on the actual content
    let contentActionResult;
    
    switch (flaggedContent.content_type) {
      case 'review':
        contentActionResult = await handleReviewModeration(
          flaggedContent.content_id,
          action,
          reason
        );
        break;
      case 'service':
        contentActionResult = await handleServiceModeration(
          flaggedContent.content_id,
          action,
          reason
        );
        break;
      case 'user':
        contentActionResult = await handleUserModeration(
          flaggedContent.content_id,
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
      targetUser: flaggedContent.contentAuthor?._id,
      details: {
        content_type: flaggedContent.content_type,
        content_id: flaggedContent.content_id,
        reason,
        flagId: flaggedContent._id
      }
    });
    
    // Notify user if requested
    if (notifyUser && flaggedContent.contentAuthor) {
      await sendEmail({
        to: flaggedContent.contentAuthor.email,
        subject: `Your content has been ${action === 'approve' ? 'approved' : 'removed'}`,
        template: 'contentModeration',
        data: {
          name: flaggedContent.contentAuthor.name,
          content_type: flaggedContent.content_type,
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
    return res.status(500).json({ message: 'Failed to moderate content' });
  }
};

// Handle review moderation
async function handleReviewModeration(reviewId, action, reason) {
  const review = await Review.findById(reviewId);
  
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
  const service = await Service.findById(serviceId);
  
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
  const user = await User.findById(userId);
  
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
    const statusCounts = await FlaggedContent.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get counts by content type
    const content_type = await FlaggedContent.aggregate([
      {
        $group: {
          _id: '$content_type',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get counts by severity
    const severityCounts = await FlaggedContent.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get average resolution time
    const resolutionTime = await FlaggedContent.aggregate([
      {
        $match: {
          status: { $in: ['approved', 'removed'] },
          moderatedAt: { $exists: true }
        }
      },
      {
        $project: {
          resolutionTimeMs: { $subtract: ['$moderatedAt', '$createdAt'] }
        }
      },
      {
        $group: {
          _id: null,
          averageTimeMs: { $avg: '$resolutionTimeMs' },
          minTimeMs: { $min: '$resolutionTimeMs' },
          maxTimeMs: { $max: '$resolutionTimeMs' }
        }
      },
      {
        $project: {
          averageTimeHours: { $divide: ['$averageTimeMs', 3600000] },
          minTimeHours: { $divide: ['$minTimeMs', 3600000] },
          maxTimeHours: { $divide: ['$maxTimeMs', 3600000] },
          _id: 0
        }
      }
    ]);
    
    return res.status(200).json({
      statusCounts,
      content_typeCounts,
      severityCounts,
      resolutionTime: resolutionTime[0] || {
        averageTimeHours: 0,
        minTimeHours: 0,
        maxTimeHours: 0
      },
      pendingCount: statusCounts.find(item => item._id === 'pending')?.count || 0
    });
  } catch (error) {
    console.error('Error fetching moderation stats:', error);
    return res.status(500).json({ message: 'Failed to fetch moderation statistics' });
  }
};