const express = require('express');
const router = express.Router();
const { Booking } = require('../models/Booking'); // Adjust path as needed
const { verifyToken } = require('../middleware/auth');

// Get all bookings (Admin only)
router.get('/', verifyToken, async (req, res) => {
  try {
    const bookings = await Booking.findAll();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings', error: error.message });
  }
});

// Create a new booking
router.post('/', verifyToken, async (req, res) => {
  const { userId, serviceId, date, time, status } = req.body;

  try {
    const newBooking = await Booking.create({ userId, serviceId, date, time, status });
    res.status(201).json(newBooking);
  } catch (error) {
    res.status(500).json({ message: 'Error creating booking', error: error.message });
  }
});

// Get a specific booking by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching booking', error: error.message });
  }
});

// Update a booking
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    await booking.update(req.body);
    res.json({ message: 'Booking updated successfully', booking });
  } catch (error) {
    res.status(500).json({ message: 'Error updating booking', error: error.message });
  }
});

// Delete a booking
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    await booking.destroy();
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting booking', error: error.message });
  }
});

module.exports = router;