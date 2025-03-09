'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  User.init({
    email: DataTypes.STRING,
    password_hash: DataTypes.STRING,
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    phone_number: DataTypes.STRING,
    profile_picture_url: DataTypes.STRING,
    bio: DataTypes.TEXT,
    role: DataTypes.STRING,
    is_verified: DataTypes.BOOLEAN,
    is_active: DataTypes.BOOLEAN,
    verification_token: DataTypes.STRING,
    reset_password_token: DataTypes.STRING,
    reset_password_expires: DataTypes.DATE,
    last_login: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};