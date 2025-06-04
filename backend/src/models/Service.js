'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Service extends Model {
    static associate(models) {
      // Define associations correctly
      Service.belongsTo(models.ServiceCategory, {
        foreignKey: 'serviceCategoryId',
        as: 'category'
      });
      
      Service.belongsTo(models.ServiceProviderProfile, {
        foreignKey: 'providerId',
        as: 'provider'
      });
      
      Service.hasMany(models.Booking, {
        foreignKey: 'serviceId',
        as: 'bookings'
      });
    }
  }
  
  Service.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    serviceCategoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'serviceCategoryId'  // Explicitly define field name
    },
    providerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'providerId'  // Explicitly define field name
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 60  // Default duration in minutes
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0
    },
    bookingCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'Service',
    tableName: 'Services',
    underscored: false,  // Important: Set to false to use camelCase
    freezeTableName: true,
    paranoid: true      // IMPORTANT: Disable paranoid mode (soft deletes)
  });
  
  return Service;
};