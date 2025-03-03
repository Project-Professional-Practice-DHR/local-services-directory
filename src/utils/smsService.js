const twilio = require('twilio');
require('dotenv').config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

exports.sendSMS = async (options) => {
  try {
    await client.messages.create({
      body: options.message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: options.phone
    });
  } catch (error) {
    console.error('SMS sending error:', error);
    throw new Error('SMS could not be sent');
  }
};

exports.sendBookingConfirmationSMS = async (phone, booking, serviceProvider) => {
  const message = `Booking confirmed with ${serviceProvider.businessName} on ${new Date(booking.bookingDate).toLocaleDateString()} at ${booking.startTime}. Ref: ${booking.bookingReference}`;
  
  await this.sendSMS({
    phone,
    message
  });
};