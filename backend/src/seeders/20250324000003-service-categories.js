'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Read the JSON data
      const data = JSON.parse(
        fs.readFileSync(
          path.join(__dirname, '../data/service-categories.json'),
          'utf8'
        )
      );
      
      // Insert the data
      await queryInterface.bulkInsert('ServiceCategories', data, {});
      
      console.log('ServiceCategories seeded successfully');
    } catch (error) {
      console.error('Error seeding ServiceCategories:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ServiceCategories', null, {});
  }
};
