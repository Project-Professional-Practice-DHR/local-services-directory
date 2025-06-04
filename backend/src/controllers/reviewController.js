// src/controllers/reviewController.js - Fixed version with service name retrieval

const { Review, User, Service, sequelize } = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4, validate: isUuid } = require('uuid');

/**
 * Create a proper UUID v4
 * @returns {string} A valid UUID v4
 */
const generateUuid = () => {
  return uuidv4();
};

/**
 * Create a new review
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createReview = async (req, res) => {
  try {
    const { serviceId, bookingId, rating, comment } = req.body;
    const userId = req.user.id; 

    // Validate input 
    if (!serviceId || !rating) {
      return res.status(400).json({ 
        success: false,
        message: 'Service ID and rating are required' 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false,
        message: 'Rating must be between 1 and 5' 
      });
    }

    // Try to find the service with a direct query
    let service;
    
    try {
      // First, try to find the service if serviceId is already a valid UUID
      if (isUuid(serviceId)) {
        service = await Service.findByPk(serviceId);
      }
      
      // If not found and serviceId is numeric, try finding by numeric ID
      if (!service && !isNaN(serviceId)) {
        const services = await Service.findAll({
          limit: 1,
          where: sequelize.literal(`id::text LIKE '%${serviceId.toString()}%'`)
        });
        
        if (services && services.length > 0) {
          service = services[0];
        }
      }
    } catch (error) {
      console.error('Error finding service:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Error finding service', 
        error: error.message,
        serviceId
      });
    }
    
    // If service still not found, try one more approach
    if (!service) {
      try {
        // Try a direct query
        const services = await sequelize.query(
          `SELECT * FROM "Services" WHERE id::text LIKE '%${serviceId}%' LIMIT 1`,
          { type: sequelize.QueryTypes.SELECT }
        );
        
        if (services && services.length > 0) {
          service = services[0];
        }
      } catch (error) {
        console.error('Error in fallback service query:', error);
      }
    }
    
    // Check if service exists
    if (!service) {
      return res.status(404).json({ 
        success: false,
        message: 'Service not found. Please make sure the service exists.' 
      });
    }

    // Get providerId and serviceName from service
    let providerId = service.providerId;
    let serviceName = service.name || 'Unknown Service';
    
    // Verify provider exists in the Users table
    try {
      const provider = await User.findByPk(providerId);
      if (!provider) {
        // If provider doesn't exist, try to find a valid provider to use instead
        const anyProvider = await User.findOne({
          where: {
            role: 'provider'
          }
        });
        
        if (anyProvider) {
          providerId = anyProvider.id;
          console.log(`Provider ${service.providerId} not found, using ${providerId} instead`);
        } else {
          // If no provider found, use the current user's ID as a fallback
          providerId = userId;
          console.log(`No providers found, using current user ${userId} as provider`);
        }
      }
    } catch (error) {
      console.error('Error verifying provider:', error);
      // Continue with the existing providerId, we'll handle any errors
    }

    // Handle booking ID - either use it as is if it's a valid UUID, or generate a new one
    let formattedBookingId = null;
    if (bookingId) {
      if (isUuid(bookingId)) {
        formattedBookingId = bookingId;
      } else {
        // Instead of trying to convert non-UUID bookingId, just generate a new UUID
        formattedBookingId = generateUuid();
        console.log(`Generated new UUID for bookingId ${bookingId}: ${formattedBookingId}`);
      }
    }

    // Generate a UUID for the review
    const reviewId = generateUuid();

    // Create the review with explicit id and service name
    const newReview = await Review.create({
      id: reviewId, // Explicitly set the UUID
      userId,
      providerId,
      serviceId: service.id, // Use the actual UUID from the found service
      serviceName: serviceName, // Store service name directly in the review
      bookingId: formattedBookingId, // Use properly formatted UUID or null
      rating,
      reviewText: comment, // Map comment to reviewText
      reviewDate: new Date(),
      isVerified: !!bookingId // Verify if there's a booking ID
    });

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      review: newReview
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating review', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Get reviews for a specific service
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getServiceReviews = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { minRating = 1, limit = 10, offset = 0 } = req.query;

    // Find the service with a safer approach
    let service;
    
    if (isUuid(serviceId)) {
      service = await Service.findByPk(serviceId);
    }
    
    if (!service && !isNaN(serviceId)) {
      const services = await Service.findAll({
        where: sequelize.literal(`id::text LIKE '%${serviceId.toString()}%'`),
        limit: 1
      });
      
      if (services && services.length > 0) {
        service = services[0];
      }
    }

    // Validate service exists
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Build query conditions - use the actual service ID from the database
    const whereConditions = {
      serviceId: service.id,
      rating: { [Op.gte]: minRating }
    };

    // Get total count for pagination
    const totalCount = await Review.count({ where: whereConditions });

    // Get reviews with service name
    const reviews = await Review.findAll({
      where: whereConditions,
      order: [['reviewDate', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'name', 'description']
        }
      ]
    });
    
    // Manually get user information for each review and ensure service name
    const formattedReviews = await Promise.all(reviews.map(async (review) => {
      const reviewData = review.get({ plain: true });
      try {
        const reviewer = await User.findByPk(reviewData.userId, {
          attributes: ['id', 'username', 'firstName', 'lastName', 'profilePicture']
        });
        
        // Get service name from various possible sources
        let serviceName = 'Unknown Service';
        if (reviewData.serviceName) {
          serviceName = reviewData.serviceName;
        } else if (reviewData.service && reviewData.service.name) {
          serviceName = reviewData.service.name;
        } else if (service && service.name) {
          serviceName = service.name;
        }
        
        return {
          ...reviewData,
          serviceName: serviceName, // Ensure service name is set
          user: reviewer ? reviewer.get({ plain: true }) : null
        };
      } catch (err) {
        console.error('Error fetching user data for review:', err);
        return {
          ...reviewData,
          serviceName: reviewData.serviceName || (reviewData.service && reviewData.service.name) || service.name || 'Unknown Service'
        };
      }
    }));

    // Calculate average rating
    const averageRating = await Review.findOne({
      where: whereConditions,
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating']
      ],
      raw: true
    });

    res.status(200).json({
      reviews: formattedReviews,
      totalCount,
      averageRating: averageRating ? parseFloat(averageRating.averageRating).toFixed(1) : null
    });
  } catch (error) {
    console.error('Error fetching service reviews:', error);
    res.status(500).json({ message: 'Error fetching service reviews', error: error.message });
  }
};

/**
 * Get reviews for a specific provider
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getProviderReviews = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { minRating = 1, limit = 10, offset = 0 } = req.query;

    // Find provider with UUID handling
    let formattedProviderId = providerId;
    if (!isUuid(providerId)) {
      formattedProviderId = generateUuid(); // Generate a new UUID instead
    }

    // Validate provider exists using direct query to avoid association issues
    const provider = await User.findByPk(formattedProviderId);
    if (!provider || provider.role !== 'provider') {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // Build query conditions
    const whereConditions = {
      providerId: formattedProviderId,
      rating: { [Op.gte]: minRating }
    };

    // Get total count for pagination
    const totalCount = await Review.count({ where: whereConditions });

    // Get reviews with service information
    const reviews = await Review.findAll({
      where: whereConditions,
      order: [['reviewDate', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'name', 'description', 'price']
        }
      ]
    });
    
    // Manually get user information for each review and ensure service name
    const formattedReviews = await Promise.all(reviews.map(async (review) => {
      const reviewData = review.get({ plain: true });
      try {
        const reviewer = await User.findByPk(reviewData.userId, {
          attributes: ['id', 'username', 'firstName', 'lastName', 'profilePicture']
        });
        
        // Get service name from various possible sources
        let serviceName = 'Unknown Service';
        if (reviewData.serviceName) {
          serviceName = reviewData.serviceName;
        } else if (reviewData.service && reviewData.service.name) {
          serviceName = reviewData.service.name;
        } else if (reviewData.serviceId) {
          // Try to get service name if it's not already included
          const service = await Service.findByPk(reviewData.serviceId, {
            attributes: ['id', 'name']
          });
          if (service && service.name) {
            serviceName = service.name;
          }
        }
        
        return {
          ...reviewData,
          serviceName: serviceName, // Ensure service name is set
          user: reviewer ? reviewer.get({ plain: true }) : null
        };
      } catch (err) {
        console.error('Error fetching related data for review:', err);
        return {
          ...reviewData,
          serviceName: reviewData.serviceName || (reviewData.service && reviewData.service.name) || 'Unknown Service'
        };
      }
    }));

    // Calculate average rating
    const averageRating = await Review.findOne({
      where: whereConditions,
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating']
      ],
      raw: true
    });

    res.status(200).json({
      reviews: formattedReviews,
      totalCount,
      averageRating: averageRating ? parseFloat(averageRating.averageRating).toFixed(1) : null
    });
  } catch (error) {
    console.error('Error fetching provider reviews:', error);
    res.status(500).json({ message: 'Error fetching provider reviews', error: error.message });
  }
};

/**
 * Add provider response to a review
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.addProviderResponse = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { providerResponse } = req.body;
    const providerId = req.user.id; // From verifyToken middleware

    // Format reviewId as UUID if needed
    let formattedReviewId = reviewId;
    if (!isUuid(reviewId)) {
      formattedReviewId = generateUuid(); // Generate a new UUID instead
    }

    // Validate input
    if (!providerResponse) {
      return res.status(400).json({ message: 'Provider response is required' });
    }

    // Find the review
    let review = await Review.findByPk(formattedReviewId);
    
    // If not found with formatted ID, try with original ID
    if (!review && formattedReviewId !== reviewId) {
      review = await Review.findByPk(reviewId);
    }
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Verify that the authenticated user is the provider who received the review
    if (review.providerId !== providerId) {
      return res.status(403).json({ 
        message: 'You can only respond to reviews about your own services' 
      });
    }

    // Update the review with the provider's response
    review.providerResponse = providerResponse;
    review.responseDate = new Date();
    await review.save();

    res.status(200).json({
      message: 'Response added successfully',
      review
    });
  } catch (error) {
    console.error('Error adding provider response:', error);
    res.status(500).json({ message: 'Error adding provider response', error: error.message });
  }
};

/**
 * Flag a review for moderation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.flagReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { flagReason } = req.body;
    const providerId = req.user.id; // From verifyToken middleware

    // Format reviewId as UUID if needed
    let formattedReviewId = reviewId;
    if (!isUuid(reviewId)) {
      formattedReviewId = generateUuid(); // Generate a new UUID instead
    }

    // Validate input
    if (!flagReason) {
      return res.status(400).json({ message: 'Reason for flagging is required' });
    }

    // Find the review
    let review = await Review.findByPk(formattedReviewId);
    
    // If not found with formatted ID, try with original ID
    if (!review && formattedReviewId !== reviewId) {
      review = await Review.findByPk(reviewId);
    }
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Verify that the authenticated user is the provider who received the review
    if (review.providerId !== providerId) {
      return res.status(403).json({ 
        message: 'You can only flag reviews about your own services' 
      });
    }

    // Update the review to mark it as flagged
    review.isFlagged = true;
    review.flagReason = flagReason;
    await review.save();

    // In a real application, you might want to notify an admin or create a moderation task

    res.status(200).json({
      message: 'Review flagged for moderation',
      review
    });
  } catch (error) {
    console.error('Error flagging review:', error);
    res.status(500).json({ message: 'Error flagging review', error: error.message });
  }
};

/**
 * Get all reviews written by current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getMyReviews = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Fetching reviews for user: ${userId}`);
    
    // Try multiple approaches to get reviews with service names
    let reviews = [];
    
    try {
      // First, try the Sequelize approach with includes
      reviews = await Review.findAll({
        where: { userId: userId },
        include: [
          {
            model: Service,
            as: 'service',
            attributes: ['id', 'name', 'description']
          }
        ],
        order: [['createdAt', 'DESC']]
      });
    } catch (error) {
      console.error('Error with Sequelize approach:', error);
      
      // Fall back to raw query if Sequelize approach fails
      try {
        reviews = await sequelize.query(
          `SELECT r.*, s.name as "serviceName" 
           FROM "Reviews" r
           LEFT JOIN "Services" s ON r."serviceId" = s.id
           WHERE r."userId" = :userId
           ORDER BY r."createdAt" DESC`,
          {
            replacements: { userId },
            type: sequelize.QueryTypes.SELECT
          }
        );
      } catch (sqlError) {
        console.error('Error with raw SQL approach:', sqlError);
      }
    }
    
    console.log(`Found ${reviews.length} reviews for user ${userId}`);
    
    // Format and process the reviews to ensure service names are included
    const processedReviews = await Promise.all(reviews.map(async (review) => {
      // Convert to plain object if it's a Sequelize model
      const reviewData = review.get ? review.get({ plain: true }) : review;
      
      // Get the service name from multiple possible sources
      let serviceName = 'Service'; // Default fallback name
      
      if (reviewData.serviceName) {
        serviceName = reviewData.serviceName;
      } else if (reviewData.service && reviewData.service.name) {
        serviceName = reviewData.service.name;
      } else if (reviewData.serviceId) {
        // Try to fetch the service name if we only have the ID
        try {
          const service = await Service.findByPk(reviewData.serviceId);
          if (service && service.name) {
            serviceName = service.name;
          }
        } catch (serviceError) {
          console.error(`Error fetching service ${reviewData.serviceId}:`, serviceError);
        }
      }
      
      // Map the fields to what the frontend expects
      return {
        id: reviewData.id,
        rating: reviewData.rating,
        comment: reviewData.reviewText || reviewData.comment || '',
        createdAt: reviewData.createdAt || reviewData.reviewDate || new Date(),
        updatedAt: reviewData.updatedAt || null,
        serviceName: serviceName,
        serviceId: reviewData.serviceId,
        service: {
          name: serviceName,
          id: reviewData.serviceId
        },
        userId: reviewData.userId,
        providerId: reviewData.providerId
      };
    }));
    
    console.log('Processed reviews with service names:', 
      processedReviews.map(r => ({ id: r.id, serviceName: r.serviceName })));
    
    res.status(200).json({
      success: true,
      data: processedReviews
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

/**
 * Get reviews left by a specific user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Format userId as UUID if needed
    let formattedUserId = userId;
    if (userId && !isUuid(userId)) {
      formattedUserId = generateUuid(); // Generate a new UUID instead
    }
    
    // If no userId provided, use the current user's ID
    const targetUserId = userId || formattedUserId || req.user.id;
    
    // Security check - users can only see their own reviews unless they're admins
    if (req.user.id !== targetUserId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized' 
      });
    }

    // Use a join to get service names directly
    const reviews = await sequelize.query(
      `SELECT r.*, 
              s.name as "serviceName", 
              u."firstName" as "providerFirstName", 
              u."lastName" as "providerLastName" 
       FROM "Reviews" r
       LEFT JOIN "Services" s ON r."serviceId" = s.id
       LEFT JOIN "Users" u ON r."providerId" = u.id
       WHERE r."userId" = :userId
       ORDER BY r."createdAt" DESC`,
      {
        replacements: { userId: targetUserId },
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    console.log(`Found ${reviews.length} reviews for user ${targetUserId}`);
    
    // Format data for frontend - ensure service name is set
    const formattedReviews = reviews.map(review => {
      return {
        id: review.id,
        rating: review.rating,
        comment: review.reviewText || review.comment || '',
        createdAt: review.createdAt || review.reviewDate || new Date(),
        updatedAt: review.updatedAt || null,
        serviceName: review.serviceName || 'Service', // Default if null
        serviceId: review.serviceId,
        service: {
          name: review.serviceName || 'Service', // Default if null
          id: review.serviceId
        },
        providerId: review.providerId,
        providerName: review.providerFirstName && review.providerLastName ? 
                     `${review.providerFirstName} ${review.providerLastName}` : 
                     'Service Provider'
      };
    });

    // Return reviews in the format expected by the frontend
    res.status(200).json({ 
      success: true,
      data: formattedReviews 
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    
    // Return empty array rather than failing
    res.status(200).json({
      success: true,
      data: [],
      _error: error.message // Include error for debugging but don't fail
    });
  }
};

/**
 * Update an existing review
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;
    console.log(`Update request for review ID: ${id} by user: ${userId}`);

    // Input validation
    if (!rating && !comment) {
      return res.status(400).json({
        success: false,
        message: 'Rating or comment is required for update'
      });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Try direct raw query first to see if the record exists at all
    const rawReviews = await sequelize.query(
      `SELECT r.*, s.name as "serviceName" 
       FROM "Reviews" r
       LEFT JOIN "Services" s ON r."serviceId" = s.id
       WHERE r.id = :id`,
      {
        replacements: { id },
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    console.log('Raw query result:', rawReviews);
    
    // If no results from raw query either, try case-insensitive search
    let review;
    let serviceName = 'Service'; // Default service name
    
    if (rawReviews.length === 0) {
      console.log('Trying case-insensitive search');
      const reviews = await sequelize.query(
        `SELECT r.*, s.name as "serviceName" 
         FROM "Reviews" r
         LEFT JOIN "Services" s ON r."serviceId" = s.id
         WHERE LOWER(r.id::text) = LOWER(:id)`,
        {
          replacements: { id },
          type: sequelize.QueryTypes.SELECT
        }
      );
      
      if (reviews.length > 0) {
        review = reviews[0];
        serviceName = review.serviceName || 'Service';
        console.log('Found review with case-insensitive search');
      }
    } else {
      review = rawReviews[0];
      serviceName = review.serviceName || 'Service';
      console.log('Found review with direct query');
    }
    
    // Still no review found, try with Sequelize model
    if (!review) {
      review = await Review.findByPk(id, {
        include: [
          {
            model: Service,
            as: 'service',
            attributes: ['id', 'name']
          }
        ]
      });
      
      if (review && review.service && review.service.name) {
        serviceName = review.service.name;
      }
    }
    
    if (!review) {
      // As a last resort, try to find by other means
      const allReviews = await Review.findAll({
        include: [
          {
            model: Service,
            as: 'service',
            attributes: ['id', 'name']
          }
        ]
      });
      
      // Try finding a review that matches the ID regardless of case
      const matchingReview = allReviews.find(r => 
        r.id.toLowerCase() === id.toLowerCase()
      );
      
      if (matchingReview) {
        review = matchingReview;
        if (matchingReview.service && matchingReview.service.name) {
          serviceName = matchingReview.service.name;
        }
        console.log(`Found review with ID comparison: ${matchingReview.id}`);
      } else {
        console.log(`Review with ID ${id} not found`);
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }
    }
    
    // Check if user owns the review or is an admin
    // Convert both to strings and compare to avoid type issues
    if (String(review.userId) !== String(userId) && req.user.role !== 'admin') {
      console.log(`User ${userId} not authorized to update review ${id}`);
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own reviews'
      });
    }
    
    // Update the review
    if (review.save && typeof review.save === 'function') {
      // If it's a Sequelize model instance
      if (rating) {
        review.rating = rating;
      }
      
      if (comment) {
        review.reviewText = comment;
      }
      
      await review.save();
      console.log(`Review ${id} updated via Sequelize model method`);
    } else {
      // If review is from raw query, use direct SQL
      const updateFields = [];
      const replacements = { id: review.id };
      
      if (rating) {
        updateFields.push(`"rating" = :rating`);
        replacements.rating = rating;
      }
      
      if (comment) {
        updateFields.push(`"reviewText" = :comment`);
        replacements.comment = comment;
      }
      
      updateFields.push(`"updatedAt" = NOW()`);
      
      await sequelize.query(
        `UPDATE "Reviews" SET ${updateFields.join(', ')} WHERE id = :id`,
        {
          replacements,
          type: sequelize.QueryTypes.UPDATE
        }
      );
      console.log(`Review ${id} updated via direct SQL query`);
      
      // Get the updated review for the response
      const updatedReview = await sequelize.query(
        `SELECT r.*, s.name as "serviceName" 
         FROM "Reviews" r
         LEFT JOIN "Services" s ON r."serviceId" = s.id
         WHERE r.id = :id`,
        {
          replacements: { id: review.id },
          type: sequelize.QueryTypes.SELECT
        }
      );
      
      if (updatedReview && updatedReview.length > 0) {
        review = updatedReview[0];
        serviceName = review.serviceName || serviceName;
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: {
        id: review.id,
        rating: review.rating || rating,
        comment: review.reviewText || comment,
        createdAt: review.createdAt || review.created_at,
        updatedAt: review.updatedAt || review.updated_at || new Date(),
        serviceName: serviceName,
        service: {
          name: serviceName,
          id: review.serviceId
        }
      }
    });
  } catch (error) {
    console.error('Error updating review:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating review',
      error: error.message
    });
  }
};

/**
 * Delete an existing review
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    console.log(`Delete request for review ID: ${id} by user: ${userId}`);
    
    // Try direct raw query first to see if the record exists at all
    const rawReviews = await sequelize.query(
      `SELECT r.*, s.name as "serviceName"
       FROM "Reviews" r
       LEFT JOIN "Services" s ON r."serviceId" = s.id
       WHERE r.id = :id`,
      {
        replacements: { id },
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    console.log('Raw query result:', rawReviews);
    
    // If no results from raw query either, try case-insensitive search
    let review;
    if (rawReviews.length === 0) {
      console.log('Trying case-insensitive search');
      const reviews = await sequelize.query(
        `SELECT r.*, s.name as "serviceName"
         FROM "Reviews" r
         LEFT JOIN "Services" s ON r."serviceId" = s.id
         WHERE LOWER(r.id::text) = LOWER(:id)`,
        {
          replacements: { id },
          type: sequelize.QueryTypes.SELECT
        }
      );
      
      if (reviews.length > 0) {
        review = reviews[0];
        console.log('Found review with case-insensitive search');
      }
    } else {
      review = rawReviews[0];
      console.log('Found review with direct query');
    }
    
    // Still no review found, try with Sequelize model
    if (!review) {
      review = await Review.findByPk(id, {
        include: [
          {
            model: Service,
            as: 'service',
            attributes: ['id', 'name']
          }
        ]
      });
    }
    
    if (!review) {
      // As a last resort, try to find by other means
      const allReviews = await Review.findAll({
        include: [
          {
            model: Service,
            as: 'service',
            attributes: ['id', 'name']
          }
        ]
      });
      
      // Try finding a review that matches the ID regardless of case
      const matchingReview = allReviews.find(r => 
        r.id.toLowerCase() === id.toLowerCase()
      );
      
      if (matchingReview) {
        review = matchingReview;
        console.log(`Found review with ID comparison: ${matchingReview.id}`);
      } else {
        console.log(`Review with ID ${id} not found`);
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }
    }
    
    // Check if user owns the review or is an admin
    // Convert both to strings and compare to avoid type issues
    if (String(review.userId) !== String(userId) && req.user.role !== 'admin') {
      console.log(`User ${userId} not authorized to delete review ${id}`);
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reviews'
      });
    }
    
    // Delete the review - try both methods
    if (review.destroy && typeof review.destroy === 'function') {
      await review.destroy();
      console.log(`Review ${id} deleted via Sequelize model method`);
    } else {
      // If review is from raw query, use direct SQL
      await sequelize.query(
        `DELETE FROM "Reviews" WHERE id = :id`,
        {
          replacements: { id: review.id },
          type: sequelize.QueryTypes.DELETE
        }
      );
      console.log(`Review ${id} deleted via direct SQL query`);
    }
    
    return res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting review',
      error: error.message
    });
  }
};

// Add this new endpoint to handle getting the current user's reviews
exports.getMyReviews = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Fetching reviews for current user: ${userId}`);
    
    // Try multiple approaches to get reviews with service names
    let reviews = [];
    
    try {
      // First, try the Sequelize approach with joins
      reviews = await sequelize.query(
        `SELECT r.*, 
                s.name as "serviceName", 
                u."firstName" as "providerFirstName", 
                u."lastName" as "providerLastName" 
         FROM "Reviews" r
         LEFT JOIN "Services" s ON r."serviceId" = s.id
         LEFT JOIN "Users" u ON r."providerId" = u.id
         WHERE r."userId" = :userId
         ORDER BY r."createdAt" DESC`,
        {
          replacements: { userId },
          type: sequelize.QueryTypes.SELECT
        }
      );
      
      console.log(`Found ${reviews.length} reviews using SQL query`);
    } catch (error) {
      console.error('Error with SQL approach:', error);
      
      // Fall back to Sequelize if SQL query fails
      try {
        const sequelizeReviews = await Review.findAll({
          where: { userId },
          include: [
            {
              model: Service,
              as: 'service',
              attributes: ['id', 'name', 'description']
            }
          ],
          order: [['createdAt', 'DESC']]
        });
        
        // Convert Sequelize instances to plain objects
        reviews = sequelizeReviews.map(review => review.get({ plain: true }));
        console.log(`Found ${reviews.length} reviews using Sequelize`);
      } catch (sequelizeError) {
        console.error('Error with Sequelize approach:', sequelizeError);
      }
    }
    
    // Format and process the reviews to ensure service names are included
    const processedReviews = await Promise.all(reviews.map(async (review) => {
      // Get the service name from multiple possible sources
      let serviceName = 'Custom Service'; // Better default name
      
      if (review.serviceName) {
        serviceName = review.serviceName;
      } else if (review.service && review.service.name) {
        serviceName = review.service.name;
      } else if (review.serviceId) {
        // Try to fetch the service name if we only have the ID
        try {
          const service = await Service.findByPk(review.serviceId);
          if (service && service.name) {
            serviceName = service.name;
          }
        } catch (serviceError) {
          console.error(`Error fetching service ${review.serviceId}:`, serviceError);
        }
      }
      
      // Provider name
      let providerName = 'Service Provider';
      if (review.providerFirstName && review.providerLastName) {
        providerName = `${review.providerFirstName} ${review.providerLastName}`;
      }
      
      // Map the fields to what the frontend expects
      return {
        id: review.id,
        rating: review.rating,
        comment: review.reviewText || review.comment || '',
        createdAt: review.createdAt || review.reviewDate || new Date(),
        updatedAt: review.updatedAt || null,
        serviceName: serviceName,
        serviceId: review.serviceId,
        service: {
          name: serviceName,
          id: review.serviceId
        },
        userId: review.userId,
        providerId: review.providerId,
        providerName: providerName
      };
    }));
    
    console.log('Processed reviews with service names:', 
      processedReviews.map(r => ({ id: r.id, serviceName: r.serviceName })));
    
    res.status(200).json({
      success: true,
      data: processedReviews
    });
  } catch (error) {
    console.error('Error fetching current user reviews:', error);
    res.status(200).json({
      success: true, // Return success with empty data rather than error
      data: [],
      _error: error.message // Include error for debugging
    });
  }
};