const { Model, DataTypes } = require('sequelize');
const sequelize = require('../../config/app.config').database.sequelize;
class ServiceProvider extends Model {}

ServiceProvider.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  businessName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  businessDescription: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: false
  }
}, { sequelize, modelName: 'serviceProvider' });

module.exports = ServiceProvider;