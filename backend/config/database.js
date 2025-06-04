const { Sequelize } = require('sequelize');
const path = require('path');
// Load .env from the parent directory
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Check if DATABASE_URL is defined
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL is not defined in your environment variables!');
  console.error('Please make sure you have a .env file with DATABASE_URL defined.');
  process.exit(1);
}

// Initialize Sequelize with the DATABASE_URL
const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  logging: process.env.DATABASE_LOGGING === 'true' ? console.log : false,
  define: {
    underscored: true,
    timestamps: true,
    paranoid: true,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  }
});

// Test database connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL database');
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    return false;
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