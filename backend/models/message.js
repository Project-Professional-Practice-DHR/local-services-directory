'use strict';
const { Model, DataTypes } = require('sequelize');
const User = require('./User');
const Booking = require('./Booking');

module.exports = (sequelize) => {
  class Message extends Model {
    static associate(models) {
      Message.belongsTo(models.User, { foreignKey: 'sender_id', as: 'sender' });
      Message.belongsTo(models.User, { foreignKey: 'receiver_id', as: 'receiver' });
      Message.belongsTo(models.Booking, { foreignKey: 'booking_id', as: 'booking' });
    }
  }

  Message.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      sender_id: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'sender_id',
        references: {
          model: User,
          key: 'id'
        }
      },
      receiver_id: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'receiver_id',
        references: {
          model: User,
          key: 'id'
        }
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        trim: true
      },
      booking_id: {
        type: DataTypes.UUID,
        field: 'booking_id',
        references: {
          model: Booking,
          key: 'id'
        }
      },
      is_read: {
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
    },
    {
      sequelize,
      modelName: 'Message',
      timestamps: true,
      indexes: [
        { fields: ['sender_id', 'receiver_id'] },
        { fields: ['receiver_id', 'is_read'] }
      ]
    }
  );

  return Message;
};