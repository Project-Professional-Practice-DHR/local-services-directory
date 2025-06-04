'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Read the JSON data
      const data = JSON.parse(
        fs.readFileSync(
          path.join(__dirname, '../data/bookings.json'),
          'utf8'
        )
      );
      
      // Insert the data
      await queryInterface.bulkInsert('Bookings', data, {});
      
      console.log('Bookings seeded successfully');
    } catch (error) {
      console.error('Error seeding Bookings:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Bookings', null, {});
  }
};
