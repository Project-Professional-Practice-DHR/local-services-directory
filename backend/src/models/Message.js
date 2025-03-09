const { DataTypes } = require('sequelize');
const sequelize = require('../../config/app.config').database.sequelize;
const User = require('./User');
const Booking = require('./Booking');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  sender_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  receiver_id: {
    type: DataTypes.UUID,
    allowNull: false,
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
    type: DataTypes.ARRAY(DataTypes.JSON), // Storing attachments as an array of objects
    defaultValue: []
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['sender_id', 'receiver_id'] }, // Compound index for sender & receiver
    { fields: ['receiver_id', 'is_read'] }    // Index for unread messages
  ]
});

// Define associations
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
Message.belongsTo(User, { foreignKey: 'receiver_id', as: 'receiver' });
Message.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

module.exports = Message;