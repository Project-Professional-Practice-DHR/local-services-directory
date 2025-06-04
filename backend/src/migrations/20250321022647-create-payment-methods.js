'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PaymentMethods', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      userId: {
        type: Sequelize.UUID,
        references: {
          model: 'Users',
          key: 'id'
        },
        allowNull: false,
        onDelete: 'CASCADE'
      },
      cardNumber: {
        type: Sequelize.STRING,
        allowNull: false
      },
      expiryDate: {
        type: Sequelize.STRING,
        allowNull: false
      },
      cvc: {
        type: Sequelize.STRING
      },
      billingAddress: {
        type: Sequelize.STRING
      },
      isDefault: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      cardType: {
        type: Sequelize.STRING
      },
      lastFourDigits: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deletedAt: {  // Using camelCase for DB
        type: Sequelize.DATE,
        defaultValue: null
      }
    });

    // Add indexes
    await queryInterface.addIndex('PaymentMethods', ['userId']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('PaymentMethods');
  }
};