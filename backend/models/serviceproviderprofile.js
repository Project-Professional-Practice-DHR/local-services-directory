'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ServiceProviderProfile extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  ServiceProviderProfile.init({
    user_id: DataTypes.UUID,
    business_name: DataTypes.STRING,
    business_description: DataTypes.TEXT,
    years_of_experience: DataTypes.INTEGER,
    is_verified: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'ServiceProviderProfile',
  });
  return ServiceProviderProfile;
};