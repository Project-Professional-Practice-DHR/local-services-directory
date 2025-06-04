'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ServiceProvider extends Model {
    static associate(models) {
      ServiceProvider.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      
      // Optional additional associations
      // ServiceProvider.hasMany(models.Service, {
      //   foreignKey: 'providerId',
      //   as: 'services'
      // });
    }
  }
  
  ServiceProvider.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    businessName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    businessDescription: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'ServiceProvider',
    tableName: 'ServiceProviders',
    underscored: false,
    freezeTableName: true
  });
  
  return ServiceProvider;
};