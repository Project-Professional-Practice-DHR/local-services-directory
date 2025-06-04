'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    static associate(models) {
      Payment.belongsTo(models.Booking, {
        foreignKey: 'bookingId',
        as: 'booking'
      });
      
      if (models.Payout) {
        Payment.belongsTo(models.Payout, {
          foreignKey: 'payoutId',
          as: 'payout'
        });
      }
    }
  }
  
  Payment.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled', 'refunded'),
      defaultValue: 'pending'
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    refundStatus: {
      type: DataTypes.ENUM('none', 'partial', 'full'),
      defaultValue: 'none'
    },
    refundAmount: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    bookingId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    payoutId: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Payment',
    tableName: 'Payments',
    underscored: false,
    freezeTableName: true
  });
  
  return Payment;
};