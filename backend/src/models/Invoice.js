'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Invoice extends Model {
    static associate(models) {
      Invoice.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      
      if (models.Transaction) {
        Invoice.belongsTo(models.Transaction, {
          foreignKey: 'transactionId',
          as: 'transaction'
        });
      }
    }
  }
  
  Invoice.init({
    userId: DataTypes.UUID,
    transactionId: DataTypes.UUID,
    amount: DataTypes.DECIMAL,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Invoice',
    tableName: 'Invoices',
    underscored: false,
    freezeTableName: true,
    timestamps: true
  });
  
  return Invoice;
};