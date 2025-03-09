const { Model, DataTypes } = require('sequelize');
const sequelize = require('../../config/app.config').database.sequelize;
const ServiceProvider = require('./ServiceProvider');
const Category = require('./ServiceCategory');

class Service extends Model {}

Service.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  providerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: ServiceProvider,
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Category,
      key: 'id'
    }
  }
}, { sequelize, modelName: 'service' });

ServiceProvider.hasMany(Service, { foreignKey: 'providerId' });
Service.belongsTo(ServiceProvider, { foreignKey: 'providerId' });

module.exports = Service;