const twilio = require('twilio');

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Send SMS function
const sendSMS = async (to, body) => {
  try {
    // Ensure phone number is in E.164 format
    let formattedPhone = to;
    if (!to.startsWith('+')) {
      formattedPhone = `+${to}`;
    }
    
    const message = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });
    
    console.log('SMS sent:', message.sid);
    return message;
  } catch (error) {
    console.error('SMS sending failed:', error);
    throw error;
  }
};

// SMS notification types
const sendBookingReminder = async (booking, user) => {
  if (!user.phone) return null;
  
  const date = new Date(booking.dateTime).toLocaleDateString();
  const time = new Date(booking.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return sendSMS(
    user.phone,
    `Reminder: You have a booking for ${booking.service.title} with ${booking.provider.businessName} on ${date} at ${time}. Reply Y to confirm or N to cancel.`
  );
};

const sendProviderBookingAlert = async (booking, provider) => {
  if (!provider.phone) return null;
  
  const date = new Date(booking.dateTime).toLocaleDateString();
  const time = new Date(booking.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return sendSMS(
    provider.phone,
    `New booking alert: ${booking.user.name} has booked ${booking.service.title} on ${date} at ${time}. Check your dashboard for details.`
  );
};

const sendVerificationCode = async (phone, code) => {
  return sendSMS(
    phone,
    `Your Local Services verification code is: ${code}. This code will expire in 10 minutes.`
  );
};

module.exports = {
  sendBookingReminder,
  sendProviderBookingAlert,
  sendVerificationCode
};