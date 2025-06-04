'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Read the JSON data
      const data = JSON.parse(
        fs.readFileSync(
          path.join(__dirname, '../data/portfolio-items.json'),
          'utf8'
        )
      );
      
      // Process the data to handle any complex fields
      const processedData = data.map(item => {
        // Create a new object with processed fields
        const processedItem = {
          ...item
        };
        
        // Handle potential JSON fields
        if (item.images) {
          processedItem.images = JSON.stringify(item.images);
        }
        
        if (item.details) {
          processedItem.details = JSON.stringify(item.details);
        }
        
        if (item.metadata) {
          processedItem.metadata = JSON.stringify(item.metadata);
        }
        
        if (item.tags && Array.isArray(item.tags)) {
          processedItem.tags = JSON.stringify(item.tags);
        }
        
        // Ensure dates are properly formatted
        if (item.createdAt) {
          processedItem.createdAt = new Date(item.createdAt);
        }
        
        if (item.updatedAt) {
          processedItem.updatedAt = new Date(item.updatedAt);
        }
        
        if (item.completedAt) {
          processedItem.completedAt = item.completedAt ? new Date(item.completedAt) : null;
        }
        
        return processedItem;
      });
      
      // Insert the processed data
      await queryInterface.bulkInsert('PortfolioItems', processedData, {});
      
      console.log('PortfolioItems seeded successfully');
    } catch (error) {
      console.error('Error seeding PortfolioItems:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('PortfolioItems', null, {});
  }
};