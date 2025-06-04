// src/controllers/subscriptionController.js
const { SubscriptionPlan, ServiceProviderProfile, User } = require('../models');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.getAllPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.findAll({
      where: { isActive: true },
      order: [['price', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Get subscription plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription plans',
      error: error.message
    });
  }
};

exports.getPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const plan = await SubscriptionPlan.findByPk(id);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('Get subscription plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription plan',
      error: error.message
    });
  }
};

exports.subscribeToPlan = async (req, res) => {
  try {
    const { planId, paymentMethodId } = req.body;
    
    // Check if user is a service provider
    const providerProfile = await ServiceProviderProfile.findOne({
      where: { userId: req.user.id }
    });
    
    if (!providerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Service provider profile not found'
      });
    }
    
    // Get subscription plan
    const plan = await SubscriptionPlan.findByPk(planId);
    
    if (!plan || !plan.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found or inactive'
      });
    }
    
    // Get or create Stripe customer
    let userId = req.user.stripeuserrId;
    
    if (!userId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: `${req.user.firstName} ${req.user.lastName}`,
        metadata: {
          userId: req.user.id
        }
      });
      
      userId = customer.id;
      
      // Update user with Stripe customer ID
      await User.update(
        { stripeuserId: userId },
        { where: { id: req.user.id } }
      );
    }
    
    // Attach payment method to customer if provided
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: userId
      });
      
      // Set as default payment method
      await stripe.customers.update(userId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
    }
    
    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: userId,
      items: [
        {
          price: plan.stripePriceId // Assuming you have Stripe price IDs stored in your plan model
        }
      ],
      expand: ['latest_invoice.payment_intent']
    });
    
    // Update provider profile
    providerProfile.subscriptionTier = plan.name.toLowerCase();
    providerProfile.subscriptionExpiryDate = new Date(subscription.current_period_end * 1000);
    providerProfile.featuredListing = plan.name.toLowerCase() === 'premium';
    await providerProfile.save();
    
    res.status(200).json({
      success: true,
      message: 'Subscription created successfully',
      data: {
        subscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        clientSecret: subscription.latest_invoice.payment_intent?.client_secret
      }
    });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating subscription',
      error: error.message
    });
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    
    // Check if user is a service provider
    const providerProfile = await ServiceProviderProfile.findOne({
      where: { userId: req.user.id }
    });
    
    if (!providerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Service provider profile not found'
      });
    }
    
    // Cancel subscription in Stripe
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });
    
    res.status(200).json({
      success: true,
      message: 'Subscription will be canceled at the end of the billing period'
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error canceling subscription',
      error: error.message
    });
  }
};