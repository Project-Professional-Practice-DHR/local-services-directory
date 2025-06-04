const stripe = require('stripe')('your-stripe-secret-key'); // Replace with your actual Stripe secret key

// Example: Create a payment intent
const createPaymentIntent = async (amount) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'gbp', // Change the currency as needed
    });
    return paymentIntent;
  } catch (error) {
    throw new Error(`Error creating payment intent: ${error.message}`);
  }
};

module.exports = {
  createPaymentIntent,
};