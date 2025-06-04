'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    // First create Payouts table
    await queryInterface.createTable('Payouts', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      providerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      amount: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      fees: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      netAmount: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING,
        defaultValue: 'USD'
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'pending'
      },
      payoutMethod: {
        type: Sequelize.STRING,
        allowNull: false
      },
      payoutDetails: {
        type: Sequelize.JSON
      },
      scheduledDate: {
        type: Sequelize.DATE
      },
      processedDate: {
        type: Sequelize.DATE
      },
      reference: {
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

    // Then add foreign key constraint to Payments table
    await queryInterface.addConstraint('Payments', {
      fields: ['payoutId'],
      type: 'foreign key',
      name: 'payments_payout_fk',
      references: {
        table: 'Payouts',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    // First remove foreign key constraint
    await queryInterface.removeConstraint('Payments', 'payments_payout_fk');
    
    // Then drop Payouts table
    await queryInterface.dropTable('Payouts');
  }
};