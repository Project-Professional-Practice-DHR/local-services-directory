'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SubscriptionPlan extends Model {
    static associate(models) {
      // Define associations here if needed
      // For example, users can subscribe to plans:
      // SubscriptionPlan.hasMany(models.User, {
      //   foreignKey: 'subscriptionPlanId',
      //   as: 'subscribers'
      // });
    }
  }
  
  SubscriptionPlan.init({
    name: DataTypes.STRING,
    price: DataTypes.DECIMAL,
    features: DataTypes.TEXT,
    isActive: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'SubscriptionPlan',
    tableName: 'SubscriptionPlans',
    underscored: false,
    freezeTableName: true
  });
  
  return SubscriptionPlan;
};