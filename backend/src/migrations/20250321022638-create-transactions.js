'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Transactions', {
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
        }
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      platformFee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      providerPayout: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pending'
      },
      transactionType: {
        type: Sequelize.STRING, // Changed from ENUM to STRING
        allowNull: false,
        defaultValue: 'payment'
      },
      paymentId: {
        type: Sequelize.UUID,
        references: {
          model: 'Payments',
          key: 'id'
        },
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        defaultValue: {}
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
    await queryInterface.addIndex('Transactions', ['userId']);
    await queryInterface.addIndex('Transactions', ['status']);
    await queryInterface.addIndex('Transactions', ['paymentId']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Transactions');
  }
};