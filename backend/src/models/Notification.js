'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    static associate(models) {
      Notification.belongsTo(models.User, { 
        foreignKey: 'userId',
        as: 'user',
        onDelete: 'CASCADE' 
      });
    }
  }
  
  Notification.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
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
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    data: {
      type: DataTypes.JSON,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'Notification',
    tableName: 'Notifications',
    underscored: false,
    freezeTableName: true,
    timestamps: true
  });
  
  return Notification;
};