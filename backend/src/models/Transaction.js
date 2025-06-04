'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    static associate(models) {
      Transaction.belongsTo(models.User, { 
        foreignKey: 'userId',
        as: 'user'
      });
      
      if (models.Invoice) {
        Transaction.hasMany(models.Invoice, {
          foreignKey: 'transactionId',
          as: 'invoices'
        });
      }
    }
  }
  
  Transaction.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    platformFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    providerPayout: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending'
    }
  }, {
    sequelize,
    modelName: 'Transaction',
    tableName: 'Transactions',
    underscored: false,
    freezeTableName: true,
    timestamps: true
  });
  
  return Transaction;
};