'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Read the JSON data
      const data = JSON.parse(
        fs.readFileSync(
          path.join(__dirname, '../data/device-tokens.json'),
          'utf8'
        )
      );
      
      // Process the data to handle any complex fields
      const processedData = data.map(token => {
        // Create a new object with processed fields
        const processedToken = {
          ...token
        };
        
        // Handle potential metadata or device info JSON fields
        if (token.deviceInfo) {
          processedToken.deviceInfo = JSON.stringify(token.deviceInfo);
        }
        
        if (token.metadata) {
          processedToken.metadata = JSON.stringify(token.metadata);
        }
        
        // Ensure dates are properly formatted
        if (token.createdAt) {
          processedToken.createdAt = new Date(token.createdAt);
        }
        
        if (token.updatedAt) {
          processedToken.updatedAt = new Date(token.updatedAt);
        }
        
        if (token.lastUsedAt) {
          processedToken.lastUsedAt = token.lastUsedAt ? new Date(token.lastUsedAt) : null;
        }
        
        return processedToken;
      });
      
      // Insert the processed data
      await queryInterface.bulkInsert('DeviceTokens', processedData, {});
      
      console.log('DeviceTokens seeded successfully');
    } catch (error) {
      console.error('Error seeding DeviceTokens:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('DeviceTokens', null, {});
  }
};