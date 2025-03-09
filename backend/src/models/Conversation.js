const { DataTypes } = require('sequelize');
const sequelize = require('../../config/app.config').database.sequelize;
const User = require('./User');
const Booking = require('./Booking');

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  participants: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  lastMessage: {
    type: DataTypes.JSON, // Stores content, sender_id, and timestamp
    defaultValue: {}
  },
  unreadCount: {
    type: DataTypes.JSON, // Stores unread message count per user
    defaultValue: {}
  },
  bookingId: {
    type: DataTypes.UUID,
    references: {
      model: Booking,
      key: 'id'
    }
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['participants'] }, // Compound index for fast queries
    { fields: ['bookingId'] }
  ]
});

// Define associations
Conversation.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });

module.exports = Conversation;