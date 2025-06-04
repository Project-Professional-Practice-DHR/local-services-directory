'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Read the JSON data
      const data = JSON.parse(
        fs.readFileSync(
          path.join(__dirname, '../data/notifications.json'),
          'utf8'
        )
      );
      
      // Process the data to stringify any nested objects
      const processedData = data.map(notification => {
        // Create a new object with processed fields
        const processedNotification = {
          ...notification
        };
        
        // Handle potential complex JSON fields (metadata, data, etc.)
        // This will handle any potential nested objects or arrays
        if (notification.metadata) {
          processedNotification.metadata = JSON.stringify(notification.metadata);
        }
        
        if (notification.data) {
          processedNotification.data = JSON.stringify(notification.data);
        }
        
        // Ensure dates are properly formatted
        if (notification.createdAt) {
          processedNotification.createdAt = new Date(notification.createdAt);
        }
        
        if (notification.updatedAt) {
          processedNotification.updatedAt = new Date(notification.updatedAt);
        }
        
        if (notification.readAt) {
          processedNotification.readAt = notification.readAt ? new Date(notification.readAt) : null;
        }
        
        return processedNotification;
      });
      
      // Insert the processed data
      await queryInterface.bulkInsert('Notifications', processedData, {});
      
      console.log('Notifications seeded successfully');
    } catch (error) {
      console.error('Error seeding Notifications:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Notifications', null, {});
  }
};