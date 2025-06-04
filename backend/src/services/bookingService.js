// src/services/bookingService.js

const { Booking, Service, ServiceProviderProfile, User, Payment } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { sendBookingConfirmation } = require('../utils/emailService');
const { sendBookingConfirmationSMS } = require('../utils/smsService');

// Function to create a booking
const createBooking = async (userId, serviceId, bookingDate, startTime, endTime, notes) => {
  try {
    // Check if the service exists
    const service = await Service.findOne({
      where: { id: serviceId },
      include: [
        {
          model: ServiceProviderProfile,
          attributes: ['id', 'businessName', 'user_id']
        }
      ]
    });

    if (!service) {
      throw new Error('Service not found');
    }

    // Generate a unique booking reference
    const bookingReference = uuidv4().substring(0, 8).toUpperCase();

    // Create the booking in the database
    const booking = await Booking.create({
      bookingDate,
      startTime,
      endTime,
      notes,
      status: 'pending', // Default status when the booking is created
      bookingReference,
      user_id: userId,
      provider_id: service.ServiceProviderProfile.user_id, // provider_id
      ServiceId: serviceId,
      ServiceProviderProfileId: service.ServiceProviderProfile.id,
    });

    // Get provider's user details for notifications
    const provider = await User.findByPk(service.ServiceProviderProfile.user_id);

    // Send booking confirmation to the customer
    await sendBookingConfirmation(
      { id: userId }, // Assuming customer is passed as an object with id
      booking,
      service.ServiceProviderProfile
    );

    // Send SMS if the customer's phone number is available
    const user = await User.findByPk(userId);
    if (user.phoneNumber) {
      await sendBookingConfirmationSMS(user.phoneNumber, booking, service.ServiceProviderProfile);
    }

    return {
      success: true,
      message: 'Booking created successfully',
      bookingDetails: booking,
    };

  } catch (error) {
    console.error('Error creating booking:', error);
    throw new Error('Error creating booking');
  }
};

// Function to get bookings by customer
const getMyBookings = async (userId) => {
  try {
    const bookings = await Booking.findAll({
      where: { user_id: userId },
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
      order: [['booking_date', 'DESC']]
    });

    return {
      success: true,
      bookings: bookings
    };
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw new Error('Error fetching bookings');
  }
};

// Function to update the booking status (e.g., confirmed, canceled, completed)
const updateBookingStatus = async (bookingId, status, cancellationReason = null) => {
  try {
    // Fetch the booking to update
    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Update the booking's status and cancellation reason if applicable
    booking.status = status;
    if (status === 'canceled' && cancellationReason) {
      booking.cancellation_reason = cancellationReason;
    }
    await booking.save();

    return {
      success: true,
      message: `Booking status updated to ${status}`,
      booking: booking
    };
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw new Error('Error updating booking status');
  }
};

// Function to get booking details by booking ID
const getBookingDetails = async (bookingId) => {
  try {
    const booking = await Booking.findOne({
      where: { id: bookingId },
      include: [
        {
          model: Service,
          attributes: ['id', 'name', 'description', 'price', 'duration']
        },
        {
          model: ServiceProviderProfile,
          attributes: ['id', 'businessName', 'address', 'city', 'state']
        },
        {
          model: Payment,
          attributes: ['id', 'amount', 'paymentStatus', 'paymentDate', 'transactionId']
        },
      ]
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    return {
      success: true,
      bookingDetails: booking
    };
  } catch (error) {
    console.error('Error fetching booking details:', error);
    throw new Error('Error fetching booking details');
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  updateBookingStatus,
  getBookingDetails,
};