'use strict';
const { Model } = require('sequelize');

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       required:
 *         - userId
 *         - providerId
 *         - rating
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the review
 *         userId:
 *           type: string
 *           description: ID of the user who left the review
 *         providerId:
 *           type: string
 *           description: ID of the service provider being reviewed
 *         rating:
 *           type: integer
 *           description: Rating from 1-5
 *           minimum: 1
 *           maximum: 5
 *         reviewText:
 *           type: string
 *           description: Review text
 *         providerResponse:
 *           type: string
 *           description: The service provider's response to the review
 *         reviewDate:
 *           type: string
 *           format: date-time
 *           description: When the review was created
 *         isVerified:
 *           type: boolean
 *           description: Whether the review is from a verified customer
 *         isFlagged:
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
    static associate(models) {
      Review.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      
      Review.belongsTo(models.User, {
        foreignKey: 'providerId',
        as: 'provider'
      });
      
      // Optional Service association
      // Review.belongsTo(models.Service, {
      //   foreignKey: 'serviceId',
      //   as: 'service'
      // });
    }
  }
  
  Review.init({
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    providerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    serviceId: {
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
    reviewText: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    providerResponse: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    reviewDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    responseDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    isFlagged: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    flagReason: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Review',
    tableName: 'Reviews',
    underscored: false,
    freezeTableName: true
  });
  
  return Review;
};