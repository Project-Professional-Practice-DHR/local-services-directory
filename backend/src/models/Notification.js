const { DataTypes } = require('sequelize');
const sequelize = require('../../config/app.config').database.sequelize;
const User = require('./User'); // Import User model

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  type: {
    type: DataTypes.ENUM('message', 'booking', 'payment', 'review', 'system'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  data: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['user_id', 'is_read']
    }
  ]
});

// Associations
Notification.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });

module.exports = Notification;