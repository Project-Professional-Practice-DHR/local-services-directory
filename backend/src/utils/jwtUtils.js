const jwt = require('jsonwebtoken');
require('dotenv').config(); // Ensure environment variables are loaded

exports.generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET, // Use JWT_SECRET from .env
    { expiresIn: process.env.JWT_EXPIRES_IN } // Use JWT_EXPIRES_IN from .env
  );
};