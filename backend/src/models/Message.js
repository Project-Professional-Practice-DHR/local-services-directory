'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    static associate(models) {
      Message.belongsTo(models.User, { 
        foreignKey: 'senderId',
        as: 'sender' 
      });
      
      Message.belongsTo(models.User, { 
        foreignKey: 'receiverId',
        as: 'receiver' 
      });
      
      Message.belongsTo(models.Booking, { 
        foreignKey: 'bookingId',
        as: 'booking' 
      });
    }
  }
  
  Message.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    receiverId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      trim: true
    },
    bookingId: {
      type: DataTypes.UUID
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    readAt: {
      type: DataTypes.DATE
    },
    attachments: {
      type: DataTypes.ARRAY(DataTypes.JSON),
      defaultValue: []
    }
  }, {
    sequelize,
    modelName: 'Message',
    tableName: 'Messages',
    underscored: false,
    freezeTableName: true,
    timestamps: true
  });
  
  return Message;
};