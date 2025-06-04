'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ServiceCategory extends Model {
    static associate(models) {
      ServiceCategory.hasMany(models.Service, {
        foreignKey: 'serviceCategoryId',
        as: 'services'
      });
    }
  }
  
  ServiceCategory.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT
    },
    icon: {
      type: DataTypes.STRING
    }
  }, {
    sequelize,
    modelName: 'ServiceCategory',
    tableName: 'ServiceCategories',
    underscored: false,
    freezeTableName: true
  });
  
  return ServiceCategory;
};