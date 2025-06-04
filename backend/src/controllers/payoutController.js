const { Payment, Payout, User, Booking, sequelize } = require('../models');
const stripe = require('../utils/stripe');
const { Op } = require('sequelize');

// Platform fee percentage (e.g., 10%)
const PLATFORM_FEE_PERCENTAGE = 10;

exports.calculateProviderEarnings = async (paymentId) => {
  try {
    const payment = await Payment.findByPk(paymentId, {
      include: [{
        model: Booking,
        include: [{ model: User, as: 'provider' }]
      }]
    });
    
    if (!payment || payment.paymentStatus !== 'completed') {
      throw new Error('Payment not found or not completed');
    }
    
    const totalAmount = payment.amount;
    const feeAmount = Math.round(totalAmount * (PLATFORM_FEE_PERCENTAGE / 100));
    const providerAmount = totalAmount - feeAmount;
    
    // Record the fee and provider amount in the payment metadata
    payment.metadata = {
      ...payment.metadata,
      platformFee: feeAmount,
      providerAmount: providerAmount
    };
    await payment.save();
    
    return {
      payment,
      providerId: payment.Booking.provider.id,
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
  const transaction = await sequelize.transaction();
  
  try {
    // Find all completed payments that haven't been included in a payout
    const unprocessedPayments = await Payment.findAll({
      where: {
        paymentStatus: 'completed',
        payoutId: null,
        paidAt: { [Op.lte]: new Date(Date.now() - 24 * 60 * 60 * 1000) } // At least 24h old
      },
      include: [{
        model: Booking,
        include: [{ model: User, as: 'provider' }]
      }]
    });
    
    if (unprocessedPayments.length === 0) {
      await transaction.rollback();
      return res.status(200).json({ message: 'No payments to process for payouts' });
    }
    
    // Group payments by provider
    const paymentsByProvider = {};
    
    for (const payment of unprocessedPayments) {
      const providerId = payment.Booking.provider.id;
      
      if (!paymentsByProvider[providerId]) {
        paymentsByProvider[providerId] = [];
      }
      
      // Calculate earnings if not already in metadata
      if (!payment.metadata.platformFee || !payment.metadata.providerAmount) {
        await exports.calculateProviderEarnings(payment.id);
      }
      
      paymentsByProvider[providerId].push(payment);
    }
    
    // Create payouts for each provider
    const createdPayouts = [];
    
    for (const [providerId, payments] of Object.entries(paymentsByProvider)) {
      const provider = await User.findByPk(providerId);
      
      if (!provider || !provider.payoutMethod) {
        console.warn(`Provider ${providerId} has no payout method configured`);
        continue;
      }
      
      const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
      const totalFees = payments.reduce((sum, payment) => sum + payment.metadata.platformFee, 0);
      const netAmount = totalAmount - totalFees;
      
      const payout = await Payout.create({
        providerId,
        amount: totalAmount,
        fees: totalFees,
        netAmount,
        currency: 'USD',
        status: 'pending',
        payoutMethod: provider.payoutMethod,
        payoutDetails: provider.payoutDetails || {},
        scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // Schedule for 2 days later
      }, { transaction });
      
      // Update payments with payout ID
      for (const payment of payments) {
        payment.payoutId = payout.id;
        await payment.save({ transaction });
      }
      
      createdPayouts.push(payout);
    }
    
    await transaction.commit();
    
    res.status(200).json({
      message: `Scheduled ${createdPayouts.length} payouts for providers`,
      payouts: createdPayouts
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error scheduling payouts:', error);
    res.status(500).json({ 
      message: 'Failed to schedule payouts', 
      error: error.message 
    });
  }
};

exports.processPayouts = async (req, res) => {
  try {
    // Find all pending payouts scheduled for today or earlier
    const pendingPayouts = await Payout.findAll({
      where: {
        status: 'pending',
        scheduledDate: { [Op.lte]: new Date() }
      },
      include: [{ 
        model: User, 
        as: 'provider', 
        attributes: ['id', 'email', 'firstName', 'lastName', 'stripeAccountId'] 
      }]
    });
    
    if (pendingPayouts.length === 0) {
      return res.status(200).json({ message: 'No payouts to process' });
    }
    
    const results = {
      success: [],
      failed: []
    };
    
    for (const payout of pendingPayouts) {
      const transaction = await sequelize.transaction();
      
      try {
        payout.status = 'processing';
        await payout.save({ transaction });
        
        // Process based on payout method
        if (payout.payoutMethod === 'stripe' && payout.provider.stripeAccountId) {
          // Create a transfer via Stripe
          const transfer = await stripe.transfers.create({
            amount: Math.round(payout.netAmount * 100), // Convert to cents
            currency: 'usd',
            destination: payout.provider.stripeAccountId,
            description: `Payout for services - Ref: ${payout.id}`
          });
          
          payout.status = 'completed';
          payout.processedDate = new Date();
          payout.reference = transfer.id;
          await payout.save({ transaction });
          
          results.success.push(payout.id);
        } else {
          // For other methods, just mark as completed
          // In a real app, you'd integrate with other payment services
          payout.status = 'completed';
          payout.processedDate = new Date();
          payout.reference = `manual-${Date.now()}`;
          await payout.save({ transaction });
          
          results.success.push(payout.id);
        }
        
        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        console.error(`Error processing payout ${payout.id}:`, error);
        
        // Mark as failed in a new transaction
        try {
          await Payout.update(
            { status: 'failed' },
            { where: { id: payout.id } }
          );
        } catch (updateError) {
          console.error(`Error updating payout status to failed:`, updateError);
        }
        
        results.failed.push({
          payoutId: payout.id,
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
    res.status(500).json({ 
      message: 'Failed to process payouts', 
      error: error.message 
    });
  }
};

exports.getProviderPayouts = async (req, res) => {
  try {
    const providerId = req.user.id;
    
    const payouts = await Payout.findAll({ 
      where: { providerId },
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({ payouts });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching provider payouts', 
      error: error.message 
    });
  }
};

exports.getPayoutDetails = async (req, res) => {
  try {
    const { payoutId } = req.params;
    const userId = req.user.id;
    
    // Find the payout
    const payout = await Payout.findOne({
      where: { id: payoutId },
      include: [
        { 
          model: User, 
          as: 'provider', 
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: Payment,
          as: 'payments',
          include: [
            {
              model: Booking,
              include: [
                { model: User, as: 'customer', attributes: ['id', 'firstName', 'lastName'] }
              ]
            }
          ]
        }
      ]
    });
    
    if (!payout) {
      return res.status(404).json({ message: 'Payout not found' });
    }
    
    // Check authorization
    const isProvider = payout.providerId === userId;
    const isAdmin = req.user.role === 'admin';
    
    if (!isProvider && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this payout' });
    }
    
    res.status(200).json({ payout });
  } catch (error) {
    console.error('Error fetching payout details:', error);
    res.status(500).json({ 
      message: 'Error fetching payout details', 
      error: error.message 
    });
  }
};