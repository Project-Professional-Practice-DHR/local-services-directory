module.exports = (sequelize, DataTypes) => {
    const ServiceProvider = sequelize.define('ServiceProvider', {
      businessName: DataTypes.STRING,
      serviceType: DataTypes.ENUM('plumbing', 'electrician', 'cleaning'),
      pricingModel: DataTypes.STRING,
      portfolio: DataTypes.JSON,
      verified: DataTypes.BOOLEAN,
      ratings: DataTypes.FLOAT,
    });
  
    ServiceProvider.associate = function (models) {
      ServiceProvider.belongsTo(models.User, { foreignKey: 'user_id' });
      ServiceProvider.hasMany(models.Appointment, { foreignKey: 'providerId' });
      ServiceProvider.hasMany(models.Review, { foreignKey: 'providerId' });
      ServiceProvider.hasMany(models.Subscription, { foreignKey: 'providerId' });
    };
  
    return ServiceProvider;
  };