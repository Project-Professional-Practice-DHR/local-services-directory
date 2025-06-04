'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Service extends Model {
    static associate(models) {
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
      allowNull: false
    },
    providerId: {
      type: DataTypes.UUID,
      allowNull: false
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
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Service',
    tableName: 'Services',
    underscored: false,
    freezeTableName: true
  });
  
  return Service;
};