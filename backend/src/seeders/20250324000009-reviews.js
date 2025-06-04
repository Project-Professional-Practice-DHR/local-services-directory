'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Read the JSON data
      const data = JSON.parse(
        fs.readFileSync(
          path.join(__dirname, '../data/reviews.json'),
          'utf8'
        )
      );
      
      // Insert the data
      await queryInterface.bulkInsert('Reviews', data, {});
      
      console.log('Reviews seeded successfully');
    } catch (error) {
      console.error('Error seeding Reviews:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Reviews', null, {});
  }
};
