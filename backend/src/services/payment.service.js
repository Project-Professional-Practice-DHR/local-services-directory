const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Transaction, Booking, User } = require('../models');

// Create a payment intent
const createPaymentIntent = async (bookingId) => {
  try {
    const booking = await Booking.findByPk(bookingId, {
      include: [
        { model: User, as: 'provider' }
      ]
    });
    
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    // Calculate application fee (platform commission)
    const amount = Math.round(booking.totalPrice * 100); // Convert to cents
    const applicationFeeAmount = Math.round(amount * (process.env.PLATFORM_FEE_PERCENTAGE / 100));
    
    // Create or get Stripe customer
    let customer;
    const user = await User.findByPk(booking.userId);
    
    if (user.stripeuserId) {
      customer = user.stripeuserId;
    } else {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        name: user.name
      });
      
      // Save Stripe customer ID to user
      await User.update(
        { stripeuserId: newCustomer.id },
        { where: { id: user.id } }
      );
      
      customer = newCustomer.id;
    }
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: process.env.CURRENCY || 'usd',
      customer,
      description: `Booking #${booking.id} for ${booking.service?.title || 'service'}`,
      metadata: {
        bookingId: booking.id,
        userId: booking.userId,
        providerId: booking.providerId
      },
      application_fee_amount: applicationFeeAmount,
      transfer_data: {
        destination: booking.provider.stripeAccountId,
      },
    });
    
    // Update booking with payment intent ID
    await Booking.update(
      { paymentIntentId: paymentIntent.id },
      { where: { id: booking.id } }
    );
    
    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };
  } catch (error) {
    console.error('Payment intent creation failed:', error);
    throw error;
  }
};

// Process successful payment
const processPaymentSuccess = async (paymentIntentId) => {
  try {
    // Get payment details from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (!paymentIntent) {
      throw new Error('Payment intent not found');
    }
    
    const bookingId = paymentIntent.metadata.bookingId;
    
    // Update booking status
    await Booking.update(
      { status: 'confirmed', paymentStatus: 'paid' },
      { where: { id: bookingId } }
    );
    
    // Create transaction record
    await Transaction.create({
      bookingId,
      userId: paymentIntent.metadata.userId,
      providerId: paymentIntent.metadata.providerId,
      amount: paymentIntent.amount / 100, // Convert from cents
      fee: paymentIntent.application_fee_amount / 100, // Convert from cents
      paymentIntentId,
      status: 'completed',
      type: 'booking',
      paymentMethod: paymentIntent.payment_method_types[0]
    });
    
    return { success: true, bookingId };
  } catch (error) {
    console.error('Payment processing failed:', error);
    throw error;
  }
};

// Handle refunds
const processRefund = async (bookingId, amount, reason) => {
  try {
    const booking = await Booking.findByPk(bookingId);
    
    if (!booking || !booking.paymentIntentId) {
      throw new Error('Booking or payment not found');
    }
    
    // Calculate refund amount
    const refundAmount = amount 
      ? Math.round(amount * 100) 
      : null; // null means full refund
    
    // Process refund through Stripe
    const refund = await stripe.refunds.create({
      payment_intent: booking.paymentIntentId,
      amount: refundAmount,
      reason: reason || 'requested_by_customer'
    });
    
    // Update booking status
    await Booking.update(
      { 
        status: 'cancelled', 
        paymentStatus: refundAmount ? 'partially_refunded' : 'refunded',
        cancellationReason: reason 
      },
      { where: { id: bookingId } }
    );
    
    // Create transaction record for refund
    await Transaction.create({
      bookingId,
      userId: booking.userId,
      providerId: booking.providerId,
      amount: (refundAmount || booking.totalPrice) / 100, // Convert from cents if applicable
      fee: 0,
      paymentIntentId: booking.paymentIntentId,
      refundId: refund.id,
      status: 'completed',
      type: 'refund',
      description: reason
    });
    
    return { success: true, refundId: refund.id };
  } catch (error) {
    console.error('Refund processing failed:', error);
    throw error;
  }
};

// Create/update Stripe Connect account for providers
const createConnectAccount = async (providerId) => {
  try {
    const provider = await User.findByPk(providerId);
    
    if (!provider) {
      throw new Error('Provider not found');
    }
    
    let accountId = provider.stripeAccountId;
    
    if (!accountId) {
      // Create a new Connect account
      const account = await stripe.accounts.create({
        type: 'express',
        email: provider.email,
        business_type: 'individual',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          mcc: '7299', // Miscellaneous personal services
          url: `${process.env.FRONTEND_URL}/providers/${providerId}`
        },
        metadata: {
          providerId
        }
      });
      
      accountId = account.id;
      
      // Save Stripe account ID to provider
      await User.update(
        { stripeAccountId: accountId },
        { where: { id: providerId } }
      );
    }
    
    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.FRONTEND_URL}/provider/settings/payments?refresh=true`,
      return_url: `${process.env.FRONTEND_URL}/provider/settings/payments?success=true`,
      type: 'account_onboarding'
    });
    
    return { url: accountLink.url };
  } catch (error) {
    console.error('Connect account creation failed:', error);
    throw error;
  }
};

module.exports = {
  createPaymentIntent,
  processPaymentSuccess,
  processRefund,
  createConnectAccount
};