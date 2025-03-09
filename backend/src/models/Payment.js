const { DataTypes } = require('sequelize');
const sequelize = require('../../config/app.config').database.sequelize;
const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: true
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled', 'refunded'),
    defaultValue: 'pending'
  },
  transactionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  paymentDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  refundStatus: {
    type: DataTypes.ENUM('none', 'partial', 'full'),
    defaultValue: 'none'
  },
  refundAmount: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
});

Payment.associate = (models) => {
  Payment.belongsTo(models.Booking);
};

module.exports = Payment;
