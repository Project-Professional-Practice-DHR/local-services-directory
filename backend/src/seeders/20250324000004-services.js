'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Read the JSON data
      const data = JSON.parse(
        fs.readFileSync(
          path.join(__dirname, '../data/services.json'),
          'utf8'
        )
      );
      
      // Insert the data
      await queryInterface.bulkInsert('Services', data, {});
      
      console.log('Services seeded successfully');
    } catch (error) {
      console.error('Error seeding Services:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Services', null, {});
  }
};
