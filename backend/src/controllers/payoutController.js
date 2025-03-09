const Payment = require('../models/Payment');
const Payout = require('../models/Payout');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const stripe = require('../utils/stripe');

// Platform fee percentage (e.g., 10%)
const PLATFORM_FEE_PERCENTAGE = 10;

exports.calculateProviderEarnings = async (paymentId) => {
  try {
    const payment = await Payment.findById(paymentId)
      .populate({
        path: 'bookingId',
        populate: { path: 'serviceId', populate: { path: 'providerId' } }
      });
    
    if (!payment || payment.status !== 'completed') {
      throw new Error('Payment not found or not completed');
    }
    
    const totalAmount = payment.amount;
    const feeAmount = Math.round(totalAmount * (PLATFORM_FEE_PERCENTAGE / 100));
    const providerAmount = totalAmount - feeAmount;
    
    // Record the fee and provider amount in the payment record
    payment.platformFee = feeAmount;
    payment.providerAmount = providerAmount;
    await payment.save();
    
    return {
      payment,
      providerId: payment.bookingId.serviceId.providerId._id,
      totalAmount,
      feeAmount,
      providerAmount
    };
  } catch (error) {
    console.error('Error calculating provider earnings:', error);
    throw error;
  }
};

exports.schedulePayouts = async (req, res) => {
  try {
    // Find all completed payments that haven't been included in a payout
    const unprocessedPayments = await Payment.find({
      status: 'completed',
      paidOut: { $ne: true },
      createdAt: { $lte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // At least 24h old
    }).populate({
      path: 'bookingId',
      populate: { path: 'serviceId', populate: { path: 'providerId' } }
    });
    
    if (unprocessedPayments.length === 0) {
      return res.status(200).json({ message: 'No payments to process for payouts' });
    }
    
    // Group payments by provider
    const paymentsByProvider = {};
    
    for (const payment of unprocessedPayments) {
      const providerId = payment.bookingId.serviceId.providerId._id.toString();
      
      if (!paymentsByProvider[providerId]) {
        paymentsByProvider[providerId] = [];
      }
      
      // Calculate earnings if not already calculated
      if (!payment.platformFee || !payment.providerAmount) {
        await exports.calculateProviderEarnings(payment._id);
      }
      
      paymentsByProvider[providerId].push(payment);
    }
    
    // Create payouts for each provider
    const createdPayouts = [];
    
    for (const [providerId, payments] of Object.entries(paymentsByProvider)) {
      const provider = await User.findById(providerId);
      
      if (!provider || !provider.payoutMethod) {
        console.warn(`Provider ${providerId} has no payout method configured`);
        continue;
      }
      
      const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
      const totalFees = payments.reduce((sum, payment) => sum + payment.platformFee, 0);
      const netAmount = totalAmount - totalFees;
      
      const payout = new Payout({
        providerId,
        amount: totalAmount,
        fees: totalFees,
        netAmount,
        paymentIds: payments.map(p => p._id),
        payoutMethod: provider.payoutMethod,
        payoutDetails: provider.payoutDetails,
        scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // Schedule for 2 days later
      });
      
      await payout.save();
      
      // Mark payments as included in payout
      for (const payment of payments) {
        payment.paidOut = true;
        payment.payoutId = payout._id;
        await payment.save();
      }
      
      createdPayouts.push(payout);
    }
    
    res.status(200).json({
      message: `Scheduled ${createdPayouts.length} payouts for providers`,
      payouts: createdPayouts
    });
  } catch (error) {
    console.error('Error scheduling payouts:', error);
    res.status(500).json({ message: 'Failed to schedule payouts', error: error.message });
  }
};

exports.processPayouts = async (req, res) => {
  try {
    // Find all pending payouts scheduled for today or earlier
    const pendingPayouts = await Payout.find({
      status: 'pending',
      scheduledDate: { $lte: new Date() }
    }).populate('providerId', 'email name stripeAccountId');
    
    if (pendingPayouts.length === 0) {
      return res.status(200).json({ message: 'No payouts to process' });
    }
    
    const results = {
      success: [],
      failed: []
    };
    
    for (const payout of pendingPayouts) {
      try {
        payout.status = 'processing';
        await payout.save();
        
        // Process based on payout method
        if (payout.payoutMethod === 'stripe' && payout.providerId.stripeAccountId) {
          // Create a transfer via Stripe
          const transfer = await stripe.transfers.create({
            amount: payout.netAmount,
            currency: 'usd',
            destination: payout.providerId.stripeAccountId,
            description: `Payout for services - Ref: ${payout._id}`
          });
          
          payout.status = 'completed';
          payout.processedDate = new Date();
          payout.reference = transfer.id;
          await payout.save();
          
          results.success.push(payout._id);
        } else {
          // For other methods, just mark as completed (in real app, you'd integrate with other payment services)
          payout.status = 'completed';
          payout.processedDate = new Date();
          payout.reference = `manual-${Date.now()}`;
          await payout.save();
          
          results.success.push(payout._id);
        }
      } catch (error) {
        console.error(`Error processing payout ${payout._id}:`, error);
        
        payout.status = 'failed';
        await payout.save();
        
        results.failed.push({
          payoutId: payout._id,
          error: error.message
        });
      }
    }
    
    res.status(200).json({
      message: `Processed ${results.success.length} payouts, ${results.failed.length} failed`,
      results
    });
  } catch (error) {
    console.error('Error processing payouts:', error);
    res.status(500).json({ message: 'Failed to process payouts', error: error.message });
  }
};

exports.getProviderPayouts = async (req, res) => {
  try {
    const providerId = req.user._id;
    
    const payouts = await Payout.find({ providerId })
      .sort({ createdAt: -1 });
    
    res.status(200).json({ payouts });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching provider payouts', error: error.message });
  }
};