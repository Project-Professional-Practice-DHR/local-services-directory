// src/controllers/flaggedContentController.js
const { FlaggedContent, User } = require('../models');
const { Op } = require('sequelize');

exports.reportContent = async (req, res) => {
  try {
    const { contentType, contentId, flagReason, contentSummary } = req.body;
    const reportedbyId = req.user.id;
    
    if (!contentType || !contentId || !flagReason || !contentSummary) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Check if content is already flagged
    let flaggedContent = await FlaggedContent.findOne({
      where: { 
        contentType, 
        contentId 
      }
    });
    
    if (flaggedContent) {
      // Content already flagged, update report count and add to reports
      flaggedContent.reportCount += 1;
      
      // Add to reports array
      const newReport = {
        reportedBy: reportedbyId,
        reason: flagReason,
        timestamp: new Date()
      };
      
      flaggedContent.reports = [...flaggedContent.reports, newReport];
      await flaggedContent.save();
      
      return res.status(200).json({
        success: true,
        message: 'Report added to existing flagged content',
        data: {
          id: flaggedContent.id,
          reportCount: flaggedContent.reportCount
        }
      });
    }
    
    // Create new flagged content
    flaggedContent = await FlaggedContent.create({
      contentType,
      contentId,
      contentSummary,
      flagReason,
      reportedbyId,
      reports: [{
        reportedBy: reportedbyId,
        reason: flagReason,
        timestamp: new Date()
      }]
    });
    
    res.status(201).json({
      success: true,
      message: 'Content reported successfully',
      data: flaggedContent
    });
  } catch (error) {
    console.error('Report content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reporting content',
      error: error.message
    });
  }
};

exports.getFlaggedContent = async (req, res) => {
  try {
    // Admin only access
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    const { 
      status = 'pending', 
      type, 
      severity,
      page = 1,
      limit = 20
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Build where clause
    const whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (type) {
      whereClause.contentType = type;
    }
    
    if (severity) {
      whereClause.severity = severity;
    }
    
    const { count, rows } = await FlaggedContent.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'contentAuthor',
          attributes: ['id', 'username', 'firstName', 'lastName']
        },
        {
          model: User,
          as: 'reportedBy',
          attributes: ['id', 'username', 'firstName', 'lastName']
        },
        {
          model: User,
          as: 'moderatedBy',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }
      ],
      order: [
        ['severity', 'DESC'],
        ['reportCount', 'DESC'],
        ['createdAt', 'DESC']
      ],
      offset,
      limit: parseInt(limit)
    });
    
    res.status(200).json({
      success: true,
      count,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get flagged content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching flagged content',
      error: error.message
    });
  }
};

exports.moderateContent = async (req, res) => {
  try {
    // Admin only access
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    const { id } = req.params;
    const { status, moderationNotes } = req.body;
    
    if (!status || !['pending', 'approved', 'removed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (pending, approved, or removed)'
      });
    }
    
    const flaggedContent = await FlaggedContent.findByPk(id);
    
    if (!flaggedContent) {
      return res.status(404).json({
        success: false,
        message: 'Flagged content not found'
      });
    }
    
    // Update moderation data
    flaggedContent.status = status;
    flaggedContent.moderationNotes = moderationNotes || '';
    flaggedContent.moderatedbyId = req.user.id;
    flaggedContent.moderatedAt = new Date();
    
    await flaggedContent.save();
    
    // TODO: Take action based on moderation decision
    // For example, if status is 'removed', you would remove the original content
    
    res.status(200).json({
      success: true,
      message: 'Content moderated successfully',
      data: flaggedContent
    });
  } catch (error) {
    console.error('Moderate content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error moderating content',
      error: error.message
    });
  }
};