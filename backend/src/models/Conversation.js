'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Conversation extends Model {
    static associate(models) {
      Conversation.belongsTo(models.Booking, { 
        foreignKey: 'bookingId', 
        as: 'booking' 
      });
    }
  }
  
  Conversation.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    participants: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      allowNull: false
    },
    lastMessage: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    unreadCount: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    bookingId: {
      type: DataTypes.UUID
    }
  }, {
    sequelize,
    modelName: 'Conversation',
    tableName: 'Conversations',
    underscored: false,
    freezeTableName: true
  });
  
  return Conversation;
};