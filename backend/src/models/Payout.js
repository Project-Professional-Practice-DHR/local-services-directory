'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Payout extends Model {
    static associate(models) {
      Payout.belongsTo(models.User, {
        foreignKey: 'providerId',
        as: 'provider'
      });
      
      Payout.hasMany(models.Payment, {
        foreignKey: 'payoutId',
        as: 'payments'
      });
    }
  }
  
  Payout.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    providerId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    fees: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    netAmount: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD'
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending'
    },
    payoutMethod: {
      type: DataTypes.STRING,
      allowNull: false
    },
    payoutDetails: {
      type: DataTypes.JSON
    },
    scheduledDate: {
      type: DataTypes.DATE
    },
    processedDate: {
      type: DataTypes.DATE
    },
    reference: {
      type: DataTypes.STRING
    }
  }, {
    sequelize,
    modelName: 'Payout',
    tableName: 'Payouts',
    underscored: false,
    freezeTableName: true
  });
  
  return Payout;
};