'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PortfolioItem extends Model {
    static associate(models) {
      PortfolioItem.belongsTo(models.ServiceProviderProfile, {
        foreignKey: 'providerId',
        as: 'provider'
      });
    }
  }
  
  PortfolioItem.init({
    providerId: DataTypes.UUID,
    imageUrl: DataTypes.STRING,
    description: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'PortfolioItem',
    tableName: 'PortfolioItems',
    underscored: false,
    freezeTableName: true
  });
  
  return PortfolioItem;
};