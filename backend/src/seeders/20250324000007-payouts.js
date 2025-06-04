'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Read the JSON data
      const data = JSON.parse(
        fs.readFileSync(
          path.join(__dirname, '../data/payouts.json'),
          'utf8'
        )
      );
      
      // Process the data to stringify any nested objects
      const processedData = data.map(payout => ({
        ...payout,
        // Convert payoutDetails object to a JSON string
        payoutDetails: JSON.stringify(payout.payoutDetails),
        // Make sure dates are properly formatted if needed
        scheduledDate: new Date(payout.scheduledDate),
        processedDate: new Date(payout.processedDate),
        createdAt: new Date(payout.createdAt),
        updatedAt: new Date(payout.updatedAt)
      }));
      
      // Insert the processed data
      await queryInterface.bulkInsert('Payouts', processedData, {});
      
      console.log('Payouts seeded successfully');
    } catch (error) {
      console.error('Error seeding Payouts:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Payouts', null, {});
  }
};