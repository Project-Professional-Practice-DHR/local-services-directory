const { DataTypes } = require('sequelize');
const sequelize = require('../../config/app.config').database.sequelize;
const ServiceCategory = sequelize.define('ServiceCategory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT
  },
  icon: {
    type: DataTypes.STRING
  }
});

module.exports = ServiceCategory;