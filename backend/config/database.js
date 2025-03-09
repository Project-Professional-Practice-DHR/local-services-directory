// src/config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Initialize Sequelize with the DATABASE_URL from your .env
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres', // Set dialect explicitly if needed
  logging: process.env.DATABASE_LOGGING === 'true' ? console.log : false,
  define: {
    underscored: true,
    timestamps: true,
    paranoid: true,  // Soft delete
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test database connection
async function testConnection() {
  try {
    await sequelize.authenticate();  // This will test if the connection is successful
    console.log('✅ Connected to PostgreSQL database');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
}

// Sync models (use with caution in production)
async function syncDatabase(force = false) {
  try {
    await sequelize.sync({ force });
    console.log('Database synchronized');
  } catch (error) {
    console.error('Database synchronization error:', error);
  }
}

module.exports = {
  sequelize,
  testConnection,
  syncDatabase
};