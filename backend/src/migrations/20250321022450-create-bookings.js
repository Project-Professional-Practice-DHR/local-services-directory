'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Bookings', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      bookingDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      startTime: {
        type: Sequelize.TIME,
        allowNull: false
      },
      endTime: {
        type: Sequelize.TIME,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING, // Changed from ENUM to STRING
        defaultValue: 'pending'
      },
      notes: {
        type: Sequelize.TEXT
      },
      price: {
        type: Sequelize.DECIMAL(10, 2)
      },
      cancellationReason: {
        type: Sequelize.TEXT
      },
      bookingReference: {
        type: Sequelize.STRING,
        unique: true
      },
      userId: {
        type: Sequelize.UUID,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      serviceId: {
        type: Sequelize.UUID,
        references: {
          model: 'Services',
          key: 'id'
        }
      },
      providerId: {
        type: Sequelize.UUID,
        references: {
          model: 'ServiceProviderProfiles',
          key: 'id'
        }
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Bookings');
  }
};