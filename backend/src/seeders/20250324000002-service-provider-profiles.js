'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Read the service provider profiles JSON data
      const rawData = JSON.parse(
        fs.readFileSync(
          path.join(__dirname, '../data/service-provider-profiles.json'),
          'utf8'
        )
      );
      
      // Transform the data to stringify business hours and ensure correct date formatting
      const transformedData = rawData.map(profile => ({
        ...profile,
        businessHours: JSON.stringify(profile.businessHours),
        createdAt: new Date(profile.createdAt),
        updatedAt: new Date(profile.updatedAt),
        subscriptionExpiryDate: new Date(profile.subscriptionExpiryDate)
      }));
      
      // Insert the transformed data
      await queryInterface.bulkInsert('ServiceProviderProfiles', transformedData, {});
      
      console.log('ServiceProviderProfiles seeded successfully');
    } catch (error) {
      console.error('Error seeding ServiceProviderProfiles:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ServiceProviderProfiles', null, {});
  }
};