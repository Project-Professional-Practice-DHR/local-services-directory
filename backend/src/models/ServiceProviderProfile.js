'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ServiceProviderProfile extends Model {
    static associate(models) {
      ServiceProviderProfile.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      
      ServiceProviderProfile.hasMany(models.Service, {
        foreignKey: 'providerId',
        as: 'services'
      });
      
      ServiceProviderProfile.hasMany(models.Booking, {
        foreignKey: 'providerId',
        as: 'bookings'
      });
      
      ServiceProviderProfile.hasMany(models.Review, {
        foreignKey: 'providerId',
        as: 'reviews'
      });
      
      ServiceProviderProfile.hasMany(models.PortfolioItem, {
        foreignKey: 'providerId',
        as: 'portfolioItems'
      });
    }
  }
  
  ServiceProviderProfile.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true
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
  }, {
    sequelize,
    modelName: 'ServiceProviderProfile',
    tableName: 'ServiceProviderProfiles',
    underscored: false,
    freezeTableName: true
  });
  
  return ServiceProviderProfile;
};