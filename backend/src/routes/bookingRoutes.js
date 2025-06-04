const express = require('express');
const router = express.Router();
const { Booking, User, Service } = require('../models'); // Import Sequelize models
const { verifyToken, authorize } = require('../middleware/auth');
const bookingController = require('../controllers/bookingController');

// Define controller methods with fallbacks for missing implementations
let controllerMethods = {
  getBookings: async (req, res) => {
    try {
      // Admin only
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized, admin access required' });
      }
      
      // Use proper Sequelize association names - adjust these based on your model definitions
      const bookings = await Booking.findAll({
        include: [
          { model: User, as: 'customer' },
          { model: User, as: 'provider' },
          { model: Service, as: 'service' }
        ]
      });
      
      res.json({
        success: true,
        bookings
      });
    } catch (error) {
      console.error('Error fetching bookings:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error fetching bookings', 
        error: error.message 
      });
    }
  },

  createBooking: async (req, res) => {
    const { serviceId, date, time, notes } = req.body;
    const userId = req.user.id;

    try {
      // First, check if the service exists
      const service = await Service.findByPk(serviceId);
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      const newBooking = await Booking.create({ 
        userId, 
        serviceId, 
        providerId: service.providerId, // Get provider ID from the service
        date, 
        time, 
        notes,
        status: 'pending' 
      });
      
      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        booking: newBooking
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error creating booking', 
        error: error.message 
      });
    }
  },

  getBooking: async (req, res) => {
    try {
      // Use proper Sequelize association names
      const booking = await Booking.findByPk(req.params.id, {
        include: [
          { model: User, as: 'customer' },
          { model: User, as: 'provider' },
          { model: Service, as: 'service' }
        ]
      });
      
      if (!booking) {
        return res.status(404).json({ 
          success: false,
          message: 'Booking not found' 
        });
      }
      
      // Check if user has permission to view this booking
      if (req.user.role !== 'admin' && 
          booking.userId !== req.user.id && 
          booking.providerId !== req.user.id) {
        return res.status(403).json({ 
          success: false,
          message: 'You do not have permission to view this booking' 
        });
      }
      
      res.json({
        success: true,
        booking
      });
    } catch (error) {
      console.error('Error fetching booking:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error fetching booking', 
        error: error.message 
      });
    }
  },

  updateBooking: async (req, res) => {
    try {
      const booking = await Booking.findByPk(req.params.id);
      
      if (!booking) {
        return res.status(404).json({ 
          success: false,
          message: 'Booking not found' 
        });
      }
      
      // Check if user has permission to update this booking
      if (req.user.role !== 'admin' && 
          booking.userId !== req.user.id && 
          booking.providerId !== req.user.id) {
        return res.status(403).json({ 
          success: false,
          message: 'You do not have permission to update this booking' 
        });
      }
      
      // Validate status transitions
      if (req.body.status) {
        // Validate status based on user role and current booking status
        const isValidTransition = validateStatusTransition(
          booking.status,
          req.body.status,
          booking.userId === req.user.id,
          booking.providerId === req.user.id,
          req.user.role === 'admin'
        );
        
        if (!isValidTransition) {
          return res.status(400).json({
            success: false,
            message: `Cannot change booking status from '${booking.status}' to '${req.body.status}'`
          });
        }
      }
      
      // Customer can only update certain fields
      if (booking.userId === req.user.id && req.user.role === 'customer') {
        const allowedFields = ['notes', 'cancelReason'];
        const filteredBody = {};
        
        Object.keys(req.body).forEach(key => {
          if (allowedFields.includes(key)) {
            filteredBody[key] = req.body[key];
          }
        });
        
        // Allow cancellation
        if (req.body.status === 'cancelled' && booking.status !== 'completed') {
          filteredBody.status = 'cancelled';
        }
        
        await booking.update(filteredBody);
      } 
      // Provider or admin can update status and other fields
      else {
        await booking.update(req.body);
      }
      
      // Refresh booking with associations
      const updatedBooking = await Booking.findByPk(req.params.id, {
        include: [
          { model: User, as: 'customer' },
          { model: User, as: 'provider' },
          { model: Service, as: 'service' }
        ]
      });
      
      res.json({ 
        success: true,
        message: 'Booking updated successfully', 
        booking: updatedBooking 
      });
    } catch (error) {
      console.error('Error updating booking:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error updating booking', 
        error: error.message 
      });
    }
  },

  deleteBooking: async (req, res) => {
    try {
      const booking = await Booking.findByPk(req.params.id);
      
      if (!booking) {
        return res.status(404).json({ 
          success: false,
          message: 'Booking not found' 
        });
      }
      
      // Only admin or the customer can delete bookings
      if (req.user.role !== 'admin' && booking.userId !== req.user.id) {
        return res.status(403).json({ 
          success: false,
          message: 'You do not have permission to delete this booking' 
        });
      }
      
      await booking.destroy();
      
      res.json({ 
        success: true,
        message: 'Booking deleted successfully' 
      });
    } catch (error) {
      console.error('Error deleting booking:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error deleting booking', 
        error: error.message 
      });
    }
  },

  getUserBookings: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const bookings = await Booking.findAll({
        where: { userId },
        include: [
          { model: User, as: 'provider' },
          { model: Service, as: 'service' }
        ],
        order: [['date', 'DESC']]
      });
      
      res.json({
        success: true,
        bookings
      });
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error fetching user bookings', 
        error: error.message 
      });
    }
  },

  getProviderBookings: async (req, res) => {
    try {
      const providerId = req.user.id;
      
      const bookings = await Booking.findAll({
        where: { providerId },
        include: [
          { model: User, as: 'customer' },
          { model: Service, as: 'service' }
        ],
        order: [['date', 'DESC']]
      });
      
      res.json({
        success: true,
        bookings
      });
    } catch (error) {
      console.error('Error fetching provider bookings:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error fetching provider bookings', 
        error: error.message 
      });
    }
  }
};

// Override with bookingController methods if available
if (bookingController) {
  if (bookingController.getBookings) controllerMethods.getBookings = bookingController.getBookings;
  if (bookingController.createBooking) controllerMethods.createBooking = bookingController.createBooking;
  if (bookingController.getBooking) controllerMethods.getBooking = bookingController.getBooking;
  if (bookingController.updateBooking) controllerMethods.updateBooking = bookingController.updateBooking;
  if (bookingController.deleteBooking) controllerMethods.deleteBooking = bookingController.deleteBooking;
  if (bookingController.getUserBookings) controllerMethods.getUserBookings = bookingController.getUserBookings;
  if (bookingController.getProviderBookings) controllerMethods.getProviderBookings = bookingController.getProviderBookings;
}

// Helper function to validate booking status transitions
const validateStatusTransition = (currentStatus, newStatus, isCustomer, isProvider, isAdmin) => {
  // Admin can make any transition
  if (isAdmin) return true;
  
  // Define allowed transitions based on role and current status
  const allowedTransitions = {
    customer: {
      pending: ['canceled'],
      confirmed: ['canceled'],
      in_progress: [], // Customer can't change from in_progress
      completed: [], // Customer can't change from completed
      cancelled: [], // Can't un-cancel
      rejected: []  // Can't change from rejected
    },
    provider: {
      pending: ['confirmed', 'rejected', 'canceled'],
      confirmed: ['in_progress', 'canceled'],
      in_progress: ['completed', 'canceled'],
      completed: [], // Provider can't change from completed
      cancelled: [], // Can't un-cancel
      rejected: [] // Can't change from rejected
    }
  };
  
  // Check if transition is allowed
  if (isCustomer) {
    const allowedCustomerTransitions = allowedTransitions.customer[currentStatus];
    return allowedCustomerTransitions && allowedCustomerTransitions.includes(newStatus);
  }
  
  if (isProvider) {
    const allowedProviderTransitions = allowedTransitions.provider[currentStatus];
    return allowedProviderTransitions && allowedProviderTransitions.includes(newStatus);
  }
  
  return false;
};

// Get all bookings (Admin only)
router.get('/', verifyToken, authorize(['admin']), controllerMethods.getBookings);

// Get user's bookings
router.get('/my-bookings', verifyToken, controllerMethods.getUserBookings);

// Get provider's bookings
router.get('/provider-bookings', verifyToken, authorize(['provider']), controllerMethods.getProviderBookings);

// Create a new booking
router.post('/', verifyToken, controllerMethods.createBooking);

// Get a specific booking by ID
router.get('/:id', verifyToken, controllerMethods.getBooking);

// Update a booking
router.put('/:id', verifyToken, controllerMethods.updateBooking);

// Delete a booking
router.delete('/:id', verifyToken, controllerMethods.deleteBooking);

module.exports = router;