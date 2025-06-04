'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Conversations', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      participants: {
        type: Sequelize.ARRAY(Sequelize.UUID),
        allowNull: false
      },
      lastMessage: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      unreadCount: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      bookingId: {
        type: Sequelize.UUID,
        references: {
          model: 'Bookings',
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
      }
    });
    
    // Add index on participants and bookingId
    await queryInterface.addIndex('Conversations', ['participants']);
    await queryInterface.addIndex('Conversations', ['bookingId']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Conversations');
  }
};