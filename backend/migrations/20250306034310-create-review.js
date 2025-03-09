'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Reviews', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4 // Auto-generate UUID
      },
      user_id: {
        type: Sequelize.UUID
      },
      provider_id: {
        type: Sequelize.UUID
      },
      rating: {
        type: Sequelize.INTEGER
      },
      review_text: {
        type: Sequelize.TEXT
      },
      provider_response: {
        type: Sequelize.TEXT
      },
      review_date: {
        type: Sequelize.DATE
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
    await queryInterface.dropTable('Reviews');
  }
};