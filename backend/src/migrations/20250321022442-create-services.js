'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Services', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      pricingType: {
        type: Sequelize.STRING,
        defaultValue: 'fixed'
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 60  // Added default value from model
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      isFeatured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      rating: {
        type: Sequelize.DECIMAL(3, 2),  // Changed to DECIMAL(3, 2) to match model
        defaultValue: 0,  // Changed to match model's default
        allowNull: true   // Removed the validation to match model
      },
      bookingCount: {  // Added missing column
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      serviceCategoryId: {
        type: Sequelize.UUID,
        references: {
          model: 'ServiceCategories',
          key: 'id'
        },
        allowNull: false  // Added to match model
      },
      providerId: {
        type: Sequelize.UUID,
        references: {
          model: 'ServiceProviderProfiles',
          key: 'id'
        },
        allowNull: false,  // Added to match model
        onDelete: 'CASCADE'
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
    await queryInterface.dropTable('Services');
  }
};