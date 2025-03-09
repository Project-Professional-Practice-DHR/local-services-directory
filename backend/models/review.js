'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Review extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Review.init({
    user_id: DataTypes.UUID,
    provider_id: DataTypes.UUID,
    rating: DataTypes.INTEGER,
    review_text: DataTypes.TEXT,
    provider_response: DataTypes.TEXT,
    review_date: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Review',
  });
  return Review;
};