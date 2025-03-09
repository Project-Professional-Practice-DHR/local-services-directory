const { Review, Booking, Service, Payment, User, sequelize } = require('../models');

exports.createReview = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { bookingId, rating, text } = req.body;
    const userId = req.user.id;

    // Verify booking exists and belongs to user
    const booking = await Booking.findOne({
      where: { id: bookingId, userId, status: 'completed' },
      include: { model: Service }
    });

    if (!booking) {
      await t.rollback();
      return res.status(404).json({ message: 'Booking not found or not eligible for review' });
    }

    // Check if payment was completed
    const payment = await Payment.findOne({
      where: { bookingId, status: 'completed' }
    });

    // Check if review already exists
    const existingReview = await Review.findOne({ where: { bookingId } });
    if (existingReview) {
      await t.rollback();
      return res.status(400).json({ message: 'You have already reviewed this booking' });
    }

    // Create the review
    const review = await Review.create({
      userId,
      serviceId: booking.service.id,
      providerId: booking.service.providerId,
      bookingId,
      rating,
      text,
      verified: !!payment // Mark as verified if payment exists
    }, { transaction: t });

    // Update service rating
    const serviceReviews = await Review.findAll({ where: { serviceId: booking.service.id } });
    const totalRating = serviceReviews.reduce((sum, rev) => sum + rev.rating, 0);
    const averageRating = totalRating / serviceReviews.length;

    await Service.update(
      { rating: averageRating, reviewCount: serviceReviews.length },
      { where: { id: booking.service.id }, transaction: t }
    );

    // Update provider rating
    const providerReviews = await Review.findAll({ where: { providerId: booking.service.providerId } });
    const providerTotalRating = providerReviews.reduce((sum, rev) => sum + rev.rating, 0);
    const providerAverageRating = providerTotalRating / providerReviews.length;

    await User.update(
      { rating: providerAverageRating, reviewCount: providerReviews.length },
      { where: { id: booking.service.providerId }, transaction: t }
    );

    await t.commit();

    // Populate response data
    const populatedReview = await Review.findByPk(review.id, {
      include: [
        { model: User, attributes: ['name', 'profileImage'] },
        { model: Service, attributes: ['title'] }
      ]
    });

    res.status(201).json({ message: 'Review submitted successfully', review: populatedReview });

  } catch (error) {
    await t.rollback();
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Failed to submit review', error: error.message });
  }
};

exports.getServiceReviews = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { verified } = req.query;

    const whereClause = { serviceId };
    if (verified === 'true') whereClause.verified = true;

    const reviews = await Review.findAll({
      where: whereClause,
      include: { model: User, attributes: ['name', 'profileImage'] },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ reviews });
  } catch (error) {
    console.error('Error fetching service reviews:', error);
    res.status(500).json({ message: 'Failed to fetch reviews', error: error.message });
  }
};

exports.getProviderReviews = async (req, res) => {
  try {
    const { providerId } = req.params;

    const reviews = await Review.findAll({
      where: { providerId },
      include: [
        { model: User, attributes: ['name', 'profileImage'] },
        { model: Service, attributes: ['title'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ reviews });
  } catch (error) {
    console.error('Error fetching provider reviews:', error);
    res.status(500).json({ message: 'Failed to fetch reviews', error: error.message });
  }
};

exports.addProviderResponse = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { text } = req.body;
    const providerId = req.user.id;

    const review = await Review.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.providerId !== providerId) {
      return res.status(403).json({ message: 'You can only respond to your own reviews' });
    }

    await review.update({ providerResponse: text });

    res.status(200).json({ message: 'Response added successfully', review });
  } catch (error) {
    console.error('Error adding provider response:', error);
    res.status(500).json({ message: 'Failed to add response', error: error.message });
  }
};

exports.flagReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;
    const providerId = req.user.id;

    const review = await Review.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.providerId !== providerId) {
      return res.status(403).json({ message: 'You can only flag reviews for your services' });
    }

    await review.update({ status: 'flagged', flagReason: reason });

    res.status(200).json({ message: 'Review flagged for moderation', review });
  } catch (error) {
    console.error('Error flagging review:', error);
    res.status(500).json({ message: 'Failed to flag review', error: error.message });
  }
};