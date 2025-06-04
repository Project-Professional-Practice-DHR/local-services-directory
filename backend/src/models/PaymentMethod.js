'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PaymentMethod extends Model {
    static associate(models) {
      PaymentMethod.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }
  
  PaymentMethod.init({
    userId: DataTypes.UUID,
    cardNumber: DataTypes.STRING,
    expiryDate: DataTypes.STRING,
    cvc: DataTypes.STRING,
    billingAddress: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'PaymentMethod', // Fixed typo from 'PayementMethod'
    tableName: 'PaymentMethods', // Fixed typo
    underscored: false,
    freezeTableName: true
  });
  
  return PaymentMethod;
};