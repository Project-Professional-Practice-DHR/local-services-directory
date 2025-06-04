'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DeviceToken extends Model {
    static associate(models) {
      DeviceToken.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }
  
  DeviceToken.init({
    userId: {
      type: DataTypes.UUID
    },
    token: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'DeviceToken',
    tableName: 'DeviceTokens',
    underscored: false,
    freezeTableName: true
  });
  
  return DeviceToken;
};