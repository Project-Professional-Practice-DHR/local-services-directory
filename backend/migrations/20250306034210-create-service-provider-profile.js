'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ServiceProviderProfiles', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4 // Auto-generate UUID
      },
      user_id: {
        type: Sequelize.UUID
      },
      business_name: {
        type: Sequelize.STRING
      },
      business_description: {
        type: Sequelize.TEXT
      },
      years_of_experience: {
        type: Sequelize.INTEGER
      },
      is_verified: {
        type: Sequelize.BOOLEAN
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ServiceProviderProfiles');
  }
};