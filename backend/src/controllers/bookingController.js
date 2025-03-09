const { Booking, Service, ServiceProviderProfile, User, Payment } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { sendBookingConfirmation } = require('../utils/emailService');
const { sendBookingConfirmationSMS } = require('../utils/smsService');

// Create a booking
exports.createBooking = async (req, res) => {
  try {
    const { serviceId, bookingDate, startTime, endTime, notes } = req.body;
    
    // Check if service exists
    const service = await Service.findOne({
      where: { id: serviceId, isActive: true },
      include: [
        {
          model: ServiceProviderProfile,
          attributes: ['id', 'businessName', 'User_id']
        }
      ]
    });
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or inactive'
      });
    }
    
    // Generate a unique booking reference
    const bookingReference = uuidv4().substring(0, 8).toUpperCase();
    
    // Create booking
    const booking = await Booking.create({
      bookingDate,
      startTime,
      endTime,
      notes,
      price: service.price,
      bookingReference,
      ServiceId: serviceId,
      ServiceProviderProfileId: service.ServiceProviderProfile.id,
      customerId: req.user.id
    });
    
    // Get provider's user for notifications
    const provider = await User.findByPk(service.ServiceProviderProfile.user_id);
    
    // Send booking confirmation to customer
    await sendBookingConfirmation(
      req.user,
      booking,
      service.ServiceProviderProfile
    );
    
    // Send SMS if phone number available
    if (req.user.phoneNumber) {
      await sendBookingConfirmationSMS(
        req.user.phoneNumber,
        booking,
        service.ServiceProviderProfile
      );
    }
    
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message
    });
  }
};

// Get my bookings (for customer)
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { customerId: req.user.id },
      include: [
        {
          model: Service,
          attributes: ['id', 'name', 'description']
        },
        {
          model: ServiceProviderProfile,
          attributes: ['id', 'businessName', 'address', 'city', 'state']
        },
        {
          model: Payment,
          attributes: ['id', 'amount', 'paymentStatus', 'paymentDate']
        }
      ],
      order: [['bookingDate', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your bookings',
      error: error.message
    });
  }
};

// Get provider bookings
exports.getProviderBookings = async (req, res) => {
  try {
    // Get provider profile
    const providerProfile = await ServiceProviderProfile.findOne({
      where: { User_dd: req.user.id }
    });
    
    if (!providerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Service provider profile not found'
      });
    }
    
    const { status, startDate, endDate } = req.query;
    
    // Build filter
    const whereClause = {
      ServiceProviderProfileId: providerProfile.id
    };
    
    if (status) {
      whereClause.status = status;
    }
    
    if (startDate && endDate) {
      whereClause.bookingDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.bookingDate = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.bookingDate = {
        [Op.lte]: new Date(endDate)
      };
    }
    
    const bookings = await Booking.findAll({
      where: whereClause,
      include: [
        {
          model: Service,
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'Customer',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber']
        },
        {
          model: Payment,
          attributes: ['id', 'amount', 'paymentStatus']
        }
      ],
      order: [['bookingDate', 'ASC'], ['startTime', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Get provider bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching provider bookings',
      error: error.message
    });
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    
    if (!['confirmed', 'canceled', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    // Get provider profile
    const providerProfile = await ServiceProviderProfile.findOne({
      where: { UserId: req.user.id }
    });
    
    // Find booking
    const booking = await Booking.findOne({
      where: {
        id,
        [Op.or]: [
          { customerId: req.user.id },
          { ServiceProviderProfileId: providerProfile?.id }
        ]
      },
      include: [
        {
          model: User,
          as: 'Customer',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber']
        },
        {
          model: ServiceProviderProfile,
          attributes: ['id', 'businessName']
        }
      ]
    });
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not authorized'
      });
    }
    
    // Update booking
    booking.status = status;
    if (status === 'canceled' && reason) {
      booking.cancellationReason = reason;
    }
    await booking.save();
    
    // Notify customer about booking status change
    // (This would normally send emails/SMS based on the status change)
    
    res.status(200).json({
      success: true,
      message: `Booking ${status} successfully`,
      data: booking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking status',
      error: error.message
    });
  }
};

// Get booking details
exports.getBookingDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get provider profile
    const providerProfile = await ServiceProviderProfile.findOne({
      where: { UserId: req.user.id }
    });
    
    // Find booking
    const booking = await Booking.findOne({
      where: {
        id,
        [Op.or]: [
          { customerId: req.user.id },
          { ServiceProviderProfileId: providerProfile?.id }
        ]
      },
      include: [
        {
          model: User,
          as: 'Customer',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber']
        },
        {
          model: Service,
          attributes: ['id', 'name', 'description', 'price', 'duration']
        },
        {
          model: ServiceProviderProfile,
          attributes: ['id', 'businessName', 'address', 'city', 'state', 'zipCode', 'latitude', 'longitude']
        },
        {
          model: Payment,
          attributes: ['id', 'amount', 'paymentMethod', 'paymentStatus', 'paymentDate', 'transactionId']
        },
        {
          model: Review,
          attributes: ['id', 'rating', 'comment', 'createdAt']
        }
      ]
    });
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not authorized'
      });
    }
    
    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Get booking details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking details',
      error: error.message
    });
  }
};