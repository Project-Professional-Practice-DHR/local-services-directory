const nodemailer = require('nodemailer');
const sendgrid = require('@sendgrid/mail');
require('dotenv').config();

sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

exports.sendEmail = async (options) => {
  try {
    const msg = {
      to: options.email,
      from: process.env.FROM_EMAIL || 'info@localservicesdirectory.com',
      subject: options.subject,
      text: options.message,
      html: options.html || options.message
    };
    
    await sendgrid.send(msg);
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Email could not be sent');
  }
};

exports.sendVerificationEmail = async (user, verificationToken) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  
  const message = `
    <h1>Email Verification</h1>
    <p>Thank you for registering! Please verify your email by clicking on the link below:</p>
    <a href="${verificationUrl}" target="_blank">Verify Email</a>
  `;
  
  await this.sendEmail({
    email: user.email,
    subject: 'Email Verification',
    html: message
  });
};

exports.sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const message = `
    <h1>Password Reset</h1>
    <p>You requested a password reset. Please click on the link below to reset your password:</p>
    <a href="${resetUrl}" target="_blank">Reset Password</a>
    <p>If you didn't request this, please ignore this email.</p>
  `;
  
  await this.sendEmail({
    email: user.email,
    subject: 'Password Reset',
    html: message
  });
};

exports.sendBookingConfirmation = async (user, booking, serviceProvider) => {
  const message = `
    <h1>Booking Confirmation</h1>
    <p>Your booking has been confirmed with ${serviceProvider.businessName}.</p>
    <h2>Booking Details:</h2>
    <p>Date: ${new Date(booking.bookingDate).toLocaleDateString()}</p>
    <p>Time: ${booking.startTime} - ${booking.endTime}</p>
    <p>Reference: ${booking.bookingReference}</p>
    <p>Thank you for using our platform!</p>
  `;
  
  await this.sendEmail({
    email: user.email,
    subject: 'Booking Confirmation',
    html: message
  });
};