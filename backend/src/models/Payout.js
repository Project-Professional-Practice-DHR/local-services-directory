const { DataTypes } = require('sequelize');
const sequelize = require('../../config/app.config').database.sequelize;
const Payout = sequelize.define('Payout', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  providerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users', // Ensure that the `User` model exists and matches the table name
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  fees: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  netAmount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'USD'
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  payoutMethod: {
    type: DataTypes.ENUM('bank_transfer', 'stripe', 'paypal'),
    allowNull: false
  },
  payoutDetails: {
    type: DataTypes.JSON
  },
  scheduledDate: {
    type: DataTypes.DATE
  },
  processedDate: {
    type: DataTypes.DATE
  },
  reference: {
    type: DataTypes.STRING
  }
}, { timestamps: true });

// Associations
Payout.associate = (models) => {
  Payout.belongsTo(models.User, { foreignKey: 'providerId' }); // Set up the relationship with the User model
  Payout.hasMany(models.Payment, { foreignKey: 'payoutId' }); // Assuming Payment has payoutId field to associate
};

module.exports = Payout;