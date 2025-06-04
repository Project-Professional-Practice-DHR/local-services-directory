'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false
      },
      firstName: {  // Using camelCase for DB
        type: Sequelize.STRING,
        allowNull: false
      },
      lastName: {  // Using camelCase for DB
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      phoneNumber: {  // Using camelCase for DB
        type: Sequelize.STRING
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('customer', 'provider', 'admin'),
        defaultValue: 'customer'
      },
      profilePicture: {  // Using camelCase for DB
        type: Sequelize.STRING
      },
      isVerified: {  // Using camelCase for DB
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      verificationToken: {  // Using camelCase for DB
        type: Sequelize.STRING
      },
      resetPasswordToken: {  // Using camelCase for DB
        type: Sequelize.STRING
      },
      resetPasswordExpires: {  // Using camelCase for DB
        type: Sequelize.DATE
      },
      lastLogin: {  // Using camelCase for DB
        type: Sequelize.DATE
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'suspended'),
        defaultValue: 'active'
      },
      // Add geospatial location field
      location: {
        type: Sequelize.GEOMETRY('POINT'),
        allowNull: true
      },
      // Add deviceTokens and devices fields
      deviceTokens: {  // Using camelCase for DB
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      devices: {
        type: Sequelize.ARRAY(Sequelize.JSONB),  // Store device details as JSON
        defaultValue: []
      },
      createdAt: {  // Using camelCase for DB
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {  // Using camelCase for DB
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
    await queryInterface.dropTable('Users');
  }
};