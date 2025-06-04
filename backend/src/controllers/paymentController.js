const { Payment, Booking, User, sequelize } = require('../models');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Op } = require('sequelize');

// Create payment intent
exports.createPaymentIntent = async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    // Find booking
    const booking = await Booking.findOne({ 
      where: { 
        id: bookingId, 
        userId: req.user.id, 
        status: 'confirmed' 
      }
    });
    
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found or not eligible for payment' 
      });
    }
    
    // Check if payment already exists
    const existingPayment = await Payment.findOne({ 
      where: { 
        bookingId: bookingId, 
        paymentStatus: { [Op.in]: ['pending', 'completed'] } 
      } 
    });
    
    if (existingPayment) {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment already initiated or completed for this booking' 
      });
    }
    
    // Create payment intent
    const amount = Math.round(booking.price * 100); // convert to cents
    
    const paymentIntent = await stripe.paymentIntents.create({ 
      amount,
      currency: 'usd', 
      metadata: { 
        bookingId: booking.id, 
        userId: req.user.id
      } 
    });
    
    // Create payment record
    const payment = await Payment.create({ 
      amount: booking.price, 
      paymentStatus: 'pending', 
      bookingId: booking.id, 
      metadata: { paymentIntentId: paymentIntent.id } 
    });
    
    return res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentId: payment.id
    });
    
  } catch (error) {
    console.error('Payment intent creation error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error creating payment intent', 
      error: error.message 
    });
  }
};

// Confirm payment
exports.confirmPayment = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { paymentIntentId } = req.body;
    
    // Find payment
    const payment = await Payment.findOne({
      where: { metadata: { paymentIntentId } },
      include: [{ 
        model: Booking, 
        where: { userId: req.user.id }
      }]
    });
    
    if (!payment) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found or not authorized' 
      });
    }
    
    // Update payment and booking status
    payment.paymentStatus = 'completed';
    payment.paidAt = new Date();
    await payment.save({ transaction });
    
    payment.Booking.status = 'paid';
    await payment.Booking.save({ transaction });
    
    await transaction.commit();
    
    return res.status(200).json({ 
      success: true, 
      message: 'Payment confirmed successfully', 
      payment 
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Payment confirmation error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error confirming payment', 
      error: error.message 
    });
  }
};

// Get payment details
exports.getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    // Find payment with related booking information
    const payment = await Payment.findOne({
      where: { id: paymentId },
      include: [
        {
          model: Booking,
          include: [
            { model: User, as: 'provider' },
            { model: User, as: 'customer' }
          ]
        }
      ]
    });
    
    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }
    
    // Check if user is authorized to view this payment
    const isCustomer = payment.Booking.userId === req.user.id;
    const isProvider = payment.Booking.provider.id === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isCustomer && !isProvider && !isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to view this payment' 
      });
    }
    
    return res.status(200).json({
      success: true,
      payment
    });
    
  } catch (error) {
    console.error('Get payment details error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error retrieving payment details', 
      error: error.message 
    });
  }
};

// Process refund
exports.processRefund = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { paymentId, amount, reason } = req.body;
    
    const payment = await Payment.findOne({
      where: { id: paymentId },
      include: [{ 
        model: Booking, 
        include: [{ model: User, as: 'provider' }]
      }]
    });
    
    if (!payment) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }
    
    const isProvider = payment.Booking.provider.id === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isProvider && !isAdmin) {
      await transaction.rollback();
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to process refund' 
      });
    }
    
    // Get the payment intent from metadata
    const paymentIntentId = payment.metadata.paymentIntentId;
    
    // Process refund via Stripe
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined, // convert to cents
      reason: reason || 'requested_by_customer'
    });
    
    // Update payment record
    payment.refundStatus = amount && amount < payment.amount ? 'partial' : 'full';
    payment.refundAmount = amount || payment.amount;
    payment.metadata = { 
      ...payment.metadata, 
      refundId: refund.id, 
      refundReason: reason 
    };
    await payment.save({ transaction });
    
    // Update booking status if it's a full refund
    if (!amount || amount === payment.amount) {
      payment.Booking.status = 'refunded';
      await payment.Booking.save({ transaction });
    }
    
    await transaction.commit();
    
    return res.status(200).json({ 
      success: true, 
      message: 'Refund processed successfully', 
      refund 
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Refund processing error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error processing refund', 
      error: error.message 
    });
  }
};

// Handle Stripe webhooks
exports.handleStripeWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body, 
      signature, 
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handleSuccessfulPayment(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handleFailedPayment(event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  
  res.status(200).json({ received: true });
};

async function handleSuccessfulPayment(paymentIntent) {
  const transaction = await sequelize.transaction();
  
  try {
    const payment = await Payment.findOne({ 
      where: { metadata: { paymentIntentId: paymentIntent.id } },
      include: [{ model: Booking }]
    });
    
    if (!payment) {
      await transaction.rollback();
      return;
    }
    
    payment.paymentStatus = 'completed';
    payment.paidAt = new Date();
    await payment.save({ transaction });
    
    // Update booking status
    payment.Booking.status = 'paid';
    await payment.Booking.save({ transaction });
    
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    console.error('Error handling successful payment:', error);
  }
}

async function handleFailedPayment(paymentIntent) {
  try {
    const payment = await Payment.findOne({ 
      where: { metadata: { paymentIntentId: paymentIntent.id } }
    });
    
    if (!payment) return;
    
    payment.paymentStatus = 'failed';
    payment.metadata = { 
      ...payment.metadata, 
      failureReason: paymentIntent.last_payment_error?.message || 'Unknown error' 
    };
    
    await payment.save();
  } catch (error) {
    console.error('Error handling failed payment:', error);
  }
}

// Get customer payment history
exports.getCustomerPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const payments = await Payment.findAll({
      include: [
        {
          model: Booking,
          where: { userId },
          include: [
            { model: User, as: 'provider', attributes: ['id', 'firstName', 'lastName'] }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    return res.status(200).json({
      success: true,
      payments
    });
    
  } catch (error) {
    console.error('Get customer payment history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving payment history',
      error: error.message
    });
  }
};

// Get provider payment history
exports.getProviderPaymentHistory = async (req, res) => {
  try {
    const providerId = req.user.id;
    
    const payments = await Payment.findAll({
      include: [
        {
          model: Booking,
          where: { providerId },
          include: [
            { model: User, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'email'] }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    return res.status(200).json({
      success: true,
      payments
    });
    
  } catch (error) {
    console.error('Get provider payment history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving payment history',
      error: error.message
    });
  }
};