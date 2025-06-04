'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ServiceCategory extends Model {
    static associate(models) {
      // Define the association clearly with the right foreign key
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
      type: DataTypes.TEXT,
      allowNull: true
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true
    },
  }, {
    sequelize,
    modelName: 'ServiceCategory',
    tableName: 'ServiceCategories',
    underscored: false,  // Important: Set to false to use camelCase
    freezeTableName: true,
    paranoid: false      // IMPORTANT: Disable paranoid mode (soft deletes)
  });
  
  return ServiceCategory;
};