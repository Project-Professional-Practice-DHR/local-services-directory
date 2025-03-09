const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

// Email templates
const readHTMLFile = (path) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, { encoding: 'utf-8' }, (err, html) => {
      if (err) {
        reject(err);
      } else {
        resolve(html);
      }
    });
  });
};

// Configure OAuth2 for Gmail
const createTransporter = async () => {
  // Use OAuth2 or direct SMTP based on environment
  if (process.env.EMAIL_USE_OAUTH === 'true') {
    const oauth2Client = new OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN
    });

    const accessToken = await new Promise((resolve, reject) => {
      oauth2Client.getAccessToken((err, token) => {
        if (err) {
          reject(err);
        }
        resolve(token);
      });
    });

    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_FROM,
        accessToken,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN
      }
    });
  } else {
    // For services like SendGrid, Mailgun, etc.
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
};

// Send email function
const sendEmail = async ({ to, subject, template, context }) => {
  try {
    const transporter = await createTransporter();
    const templatePath = path.join(__dirname, `../templates/emails/${template}.html`);
    const html = await readHTMLFile(templatePath);
    const compiledTemplate = handlebars.compile(html);
    const htmlToSend = compiledTemplate(context);
    
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html: htmlToSend
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

// Email types
const sendWelcomeEmail = async (user) => {
  return sendEmail({
    to: user.email,
    subject: 'Welcome to Local Services Directory',
    template: 'welcome',
    context: {
      name: user.name,
      verificationLink: `${process.env.FRONTEND_URL}/verify-email?token=${user.verificationToken}`
    }
  });
};

const sendBookingConfirmation = async (booking, user, provider) => {
  return sendEmail({
    to: user.email,
    subject: 'Booking Confirmation',
    template: 'booking-confirmation',
    context: {
      userName: user.name,
      providerName: provider.businessName,
      service: booking.service.title,
      date: new Date(booking.dateTime).toLocaleDateString(),
      time: new Date(booking.dateTime).toLocaleTimeString(),
      bookingId: booking.id,
      cancelLink: `${process.env.FRONTEND_URL}/bookings/${booking.id}/cancel`
    }
  });
};

const sendProviderBookingNotification = async (booking, user, provider) => {
  return sendEmail({
    to: provider.email,
    subject: 'New Booking Request',
    template: 'provider-booking',
    context: {
      providerName: provider.businessName,
      userName: user.name,
      service: booking.service.title,
      date: new Date(booking.dateTime).toLocaleDateString(),
      time: new Date(booking.dateTime).toLocaleTimeString(),
      bookingId: booking.id,
      acceptLink: `${process.env.FRONTEND_URL}/provider/bookings/${booking.id}/accept`,
      rejectLink: `${process.env.FRONTEND_URL}/provider/bookings/${booking.id}/reject`
    }
  });
};

const sendPasswordResetEmail = async (user, resetToken) => {
  return sendEmail({
    to: user.email,
    subject: 'Password Reset Request',
    template: 'password-reset',
    context: {
      name: user.name,
      resetLink: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
    }
  });
};

module.exports = {
  sendWelcomeEmail,
  sendBookingConfirmation,
  sendProviderBookingNotification,
  sendPasswordResetEmail
};