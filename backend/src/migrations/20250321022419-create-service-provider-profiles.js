'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ServiceProviderProfiles', {
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
        onDelete: 'CASCADE'
      },
      businessName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      address: {
        type: Sequelize.STRING
      },
      city: {
        type: Sequelize.STRING
      },
      state: {
        type: Sequelize.STRING
      },
      zipCode: {
        type: Sequelize.STRING
      },
      latitude: {
        type: Sequelize.FLOAT
      },
      longitude: {
        type: Sequelize.FLOAT
      },
      website: {
        type: Sequelize.STRING
      },
      businessHours: {
        type: Sequelize.JSON
      },
      businessLicense: {
        type: Sequelize.STRING
      },
      isVerifiedBusiness: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      averageRating: {
        type: Sequelize.FLOAT,
        defaultValue: 0
      },
      totalReviews: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      subscriptionTier: {
        type: Sequelize.ENUM('free', 'basic', 'premium'),
        defaultValue: 'free'
      },
      subscriptionExpiryDate: {
        type: Sequelize.DATE
      },
      featuredListing: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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