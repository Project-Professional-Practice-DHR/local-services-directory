const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ServiceProviderProfile = sequelize.define('ServiceProviderProfile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  businessName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  address: {
    type: DataTypes.STRING
  },
  city: {
    type: DataTypes.STRING
  },
  state: {
    type: DataTypes.STRING
  },
  zipCode: {
    type: DataTypes.STRING
  },
  latitude: {
    type: DataTypes.FLOAT
  },
  longitude: {
    type: DataTypes.FLOAT
  },
  website: {
    type: DataTypes.STRING
  },
  businessHours: {
    type: DataTypes.JSON
  },
  businessLicense: {
    type: DataTypes.STRING
  },
  isVerifiedBusiness: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  averageRating: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  totalReviews: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  subscriptionTier: {
    type: DataTypes.ENUM('free', 'basic', 'premium'),
    defaultValue: 'free'
  },
  subscriptionExpiryDate: {
    type: DataTypes.DATE
  },
  featuredListing: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

module.exports = ServiceProviderProfile;