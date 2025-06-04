const nodemailer = require('nodemailer');

// Create a transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // Replace with your email provider
  auth: {
    user: process.env.EMAIL_USER, // Use environment variable for security
    pass: process.env.EMAIL_PASS, // Use environment variable for security
  },
});

// Send an email
const sendEmail = async (to, subject, text, html) => {
  const mailOptions = {
    from: process.env.EMAIL_USER, // Sender address
    to, // List of recipients
    subject, // Subject line
    text, // Plain text body
    html, // HTML body
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = sendEmail;