// src/controllers/reviewController.js

const { Review, User, Service } = require('../models');
const { Op } = require('sequelize');

/**
 * Create a new review
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createReview = async (req, res) => {
  try {
    const { provider_id, service_id, rating, review_text } = req.body;
    const user_id = req.user.id; // From verifyToken middleware

    // Validate input
    if (!provider_id || !rating) {
      return res.status(400).json({ message: 'Provider ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if provider exists
    const provider = await User.findByPk(provider_id);
    if (!provider || provider.userType !== 'provider') {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // Check if service exists if service_id is provided
    if (service_id) {
      const service = await Service.findByPk(service_id);
      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }
    }

    // TODO: Check if user has booked this service before (for verified reviews)
    // This would depend on your booking model

    // Create the review
    const newReview = await Review.create({
      user_id,
      provider_id,
      service_id,
      rating,
      review_text,
      review_date: new Date(),
      is_verified: false // Set to true if you've verified the user has used this service
    });

    res.status(201).json({
      message: 'Review created successfully',
      review: newReview
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Error creating review', error: error.message });
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

    // Validate service exists
    const service = await Service.findByPk(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Build query conditions
    const whereConditions = {
      service_id: serviceId,
      rating: { [Op.gte]: minRating }
    };

    // Get total count for pagination
    const totalCount = await Review.count({ where: whereConditions });

    // Get reviews with user information
    const reviews = await Review.findAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'firstName', 'lastName', 'profilePicture']
        }
      ],
      order: [['review_date', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Calculate average rating
    const averageRating = await Review.findOne({
      where: { service_id: serviceId },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating']
      ],
      raw: true
    });

    res.status(200).json({
      reviews,
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

    // Validate provider exists
    const provider = await User.findByPk(providerId);
    if (!provider || provider.userType !== 'provider') {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // Build query conditions
    const whereConditions = {
      provider_id: providerId,
      rating: { [Op.gte]: minRating }
    };

    // Get total count for pagination
    const totalCount = await Review.count({ where: whereConditions });

    // Get reviews with user information
    const reviews = await Review.findAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'firstName', 'lastName', 'profilePicture']
        },
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'name', 'description', 'price']
        }
      ],
      order: [['review_date', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Calculate average rating
    const averageRating = await Review.findOne({
      where: { provider_id: providerId },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating']
      ],
      raw: true
    });

    res.status(200).json({
      reviews,
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
    const { provider_response } = req.body;
    const provider_id = req.user.id; // From verifyToken middleware

    // Validate input
    if (!provider_response) {
      return res.status(400).json({ message: 'Provider response is required' });
    }

    // Find the review
    const review = await Review.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Verify that the authenticated user is the provider who received the review
    if (review.provider_id !== provider_id) {
      return res.status(403).json({ 
        message: 'You can only respond to reviews about your own services' 
      });
    }

    // Update the review with the provider's response
    review.provider_response = provider_response;
    review.response_date = new Date();
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
    const { flag_reason } = req.body;
    const provider_id = req.user.id; // From verifyToken middleware

    // Validate input
    if (!flag_reason) {
      return res.status(400).json({ message: 'Reason for flagging is required' });
    }

    // Find the review
    const review = await Review.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Verify that the authenticated user is the provider who received the review
    if (review.provider_id !== provider_id) {
      return res.status(403).json({ 
        message: 'You can only flag reviews about your own services' 
      });
    }

    // Update the review to mark it as flagged
    review.is_flagged = true;
    review.flag_reason = flag_reason;
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
 * Get reviews left by a specific user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Security check - users can only see their own reviews unless they're admins
    if (req.user.id !== userId && req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Get reviews with provider and service information
    const reviews = await Review.findAll({
      where: { user_id: userId },
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'username', 'firstName', 'lastName', 'profilePicture']
        },
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'name', 'description', 'price']
        }
      ],
      order: [['review_date', 'DESC']]
    });

    res.status(200).json({ reviews });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ message: 'Error fetching user reviews', error: error.message });
  }
};