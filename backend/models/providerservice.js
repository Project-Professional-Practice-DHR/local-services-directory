'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProviderService extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  ProviderService.init({
    provider_id: DataTypes.UUID,
    service_name: DataTypes.STRING,
    description: DataTypes.TEXT,
    price: DataTypes.DECIMAL,
    availability: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'ProviderService',
  });
  return ProviderService;
};