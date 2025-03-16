'use strict';
const { Model } = require('sequelize');

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       required:
 *         - user_id
 *         - provider_id
 *         - rating
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the review
 *         user_id:
 *           type: string
 *           description: ID of the user who left the review
 *         provider_id:
 *           type: string
 *           description: ID of the service provider being reviewed
 *         rating:
 *           type: integer
 *           description: Rating from 1-5
 *           minimum: 1
 *           maximum: 5
 *         review_text:
 *           type: string
 *           description: Review text
 *         provider_response:
 *           type: string
 *           description: The service provider's response to the review
 *         review_date:
 *           type: string
 *           format: date-time
 *           description: When the review was created
 *         is_verified:
 *           type: boolean
 *           description: Whether the review is from a verified customer
 *         is_flagged:
 *           type: boolean
 *           description: Whether the review has been flagged for moderation
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */
module.exports = (sequelize, DataTypes) => {
  class Review extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Review.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
      
      Review.belongsTo(models.User, {
        foreignKey: 'provider_id',
        as: 'provider'
      });
      
      // If you have a Service model, you can uncomment this
      // Review.belongsTo(models.Service, {
      //   foreignKey: 'service_id',
      //   as: 'service'
      // });
    }
  }
  
  Review.init({
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    provider_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    service_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Services',
        key: 'id'
      }
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    review_text: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    provider_response: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    review_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    response_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    is_flagged: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    flag_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Review',
    tableName: 'reviews'
  });
  
  return Review;
};