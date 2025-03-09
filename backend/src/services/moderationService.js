const axios = require('axios');
const FlaggedContent = require('../models/FlaggedContent');

// Automated text moderation
exports.moderateText = async (text, content_type, content_id, authorId) => {
  try {
    // This would typically call an external content moderation API
    // For demonstration, we'll implement a basic keyword checker
    
    // List of problematic patterns to check for
    const problematicPatterns = [
      {
        pattern: /\b(hate|offensive|racist|sexist|violent)\b/i,
        severity: 'high',
        category: 'hate_speech'
      },
      {
        pattern: /(fuck|shit|ass|bitch)/i,
        severity: 'medium',
        category: 'profanity'
      },
      {
        pattern: /\b(fake|scam|fraud)\b/i,
        severity: 'medium',
        category: 'misleading'
      },
      {
        pattern: /\b(contact me at|call me|email me at|whatsapp)\b/i,
        severity: 'low',
        category: 'contact_info'
      }
    ];
    
    // Check text against patterns
    let flagged = false;
    let matchedPatterns = [];
    
    problematicPatterns.forEach(item => {
      if (item.pattern.test(text)) {
        flagged = true;
        matchedPatterns.push({
          category: item.category,
          severity: item.severity
        });
      }
    });
    
    // If flagged, create a record
    if (flagged) {
      // Determine highest severity
      const severityOrder = ['low', 'medium', 'high', 'critical'];
      let highestSeverity = 'low';
      
      matchedPatterns.forEach(match => {
        const currentIndex = severityOrder.indexOf(match.severity);
        const highestIndex = severityOrder.indexOf(highestSeverity);
        
        if (currentIndex > highestIndex) {
          highestSeverity = match.severity;
        }
      });
      
      // Create flagged content record
      const flaggedContent = new FlaggedContent({
        content_type,
        content_id,
        contentAuthor: authorId,
        contentSummary: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        flagReason: 'Automated detection',
        severity: highestSeverity,
        detectedIssues: matchedPatterns.map(m => m.category),
        automated: true,
        status: 'pending'
      });
      
      await flaggedContent.save();
      
      return {
        flagged: true,
        severity: highestSeverity,
        categories: [...new Set(matchedPatterns.map(m => m.category))],
        flaggedContent_id: flaggedContent._id
      };
    }
    
    return {
      flagged: false
    };
  } catch (error) {
    console.error('Text moderation error:', error);
    // In case of error, we let the content through but log the error
    return {
      flagged: false,
      error: true
    };
  }
};

// User flagging content
exports.flagContent = async (content_type, content_id, reasonText, reportedBy) => {
  try {
    // Check if content is already flagged
    let flaggedContent = await FlaggedContent.findOne({
      content_type,
      content_id,
      status: 'pending'
    });
    
    if (flaggedContent) {
      // Update existing flag
      flaggedContent.reportCount += 1;
      flaggedContent.reports.push({
        reportedBy,
        reason: reasonText,
        timestamp: new Date()
      });
      
      // Increase severity if multiple reports
      if (flaggedContent.reportCount >= 5 && flaggedContent.severity !== 'critical') {
        flaggedContent.severity = 'critical';
      } else if (flaggedContent.reportCount >= 3 && flaggedContent.severity === 'low') {
        flaggedContent.severity = 'high';
      }
      
      await flaggedContent.save();
      
      return {
        success: true,
        message: 'Content flag updated',
        flaggedContent_id: flaggedContent._id,
        newFlag: false
      };
    } else {
      // Fetch content details based on type
      let contentDetails;
      let contentAuthor;
      let contentSummary = '';
      
      switch (content_type) {
        case 'review':
          const Review = require('../models/Review');
          contentDetails = await Review.findById(content_id);
          contentAuthor = contentDetails?.userId;
          contentSummary = contentDetails?.comment?.substring(0, 100) || '';
          break;
        case 'service':
          const Service = require('../models/Service');
          contentDetails = await Service.findById(content_id);
          contentAuthor = contentDetails?.providerId;
          contentSummary = contentDetails?.description?.substring(0, 100) || '';
          break;
        // Add more content types as needed
      }
      
      // Create new flagged content
      flaggedContent = new FlaggedContent({
        content_type,
        content_id,
        contentAuthor,
        contentSummary: contentSummary + (contentSummary.length >= 100 ? '...' : ''),
        flagReason: reasonText,
        reportedBy,
        severity: 'medium',
        reportCount: 1,
        reports: [{
          reportedBy,
          reason: reasonText,
          timestamp: new Date()
        }],
        status: 'pending'
      });
      
      await flaggedContent.save();
      
      return {
        success: true,
        message: 'Content flagged successfully',
        content_id: flaggedContent._id,
        newFlag: true
      };
    }
  } catch (error) {
    console.error('Error flagging content:', error);
    return {
      success: false,
      message: 'Failed to flag content',
      error: error.message
    };
  }
};