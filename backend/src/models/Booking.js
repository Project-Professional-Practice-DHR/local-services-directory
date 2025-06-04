'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    static associate(models) {
      Booking.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'customer'
      });
      
      Booking.belongsTo(models.ServiceProviderProfile, {
        foreignKey: 'providerId',
        as: 'provider'
      });
      
      Booking.belongsTo(models.Service, {
        foreignKey: 'serviceId',
        as: 'service'
      });
      
      Booking.hasOne(models.Review, {
        foreignKey: 'bookingId',
        as: 'review'
      });
      
      Booking.hasOne(models.Payment, {
        foreignKey: 'bookingId',
        as: 'payment'
      });
      
      Booking.hasMany(models.Message, {
        foreignKey: 'bookingId',
        as: 'messages'
      });
      
      Booking.hasOne(models.Conversation, {
        foreignKey: 'bookingId',
        as: 'conversation'
      });
    }
  }
  
  Booking.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    bookingDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending'
    },
    notes: {
      type: DataTypes.TEXT
    },
    price: {
      type: DataTypes.DECIMAL(10, 2)
    },
    cancellationReason: {
      type: DataTypes.TEXT
    },
    bookingReference: {
      type: DataTypes.STRING,
      unique: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    providerId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    serviceId: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Booking',
    tableName: 'Bookings',
    underscored: false,
    freezeTableName: true
  });
  
  return Booking;
};