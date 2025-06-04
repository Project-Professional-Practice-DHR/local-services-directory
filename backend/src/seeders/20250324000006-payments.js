'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Read the JSON data
      const rawData = JSON.parse(
        fs.readFileSync(
          path.join(__dirname, '../data/payments.json'),
          'utf8'
        )
      );
      
      // Transform the data
      const transformedData = rawData.map(payment => ({
        ...payment,
        // Convert metadata to a JSON string
        metadata: JSON.stringify(payment.metadata),
        
        // Ensure dates are properly formatted
        paymentDate: new Date(payment.paymentDate),
        paidAt: payment.paidAt ? new Date(payment.paidAt) : null,
        createdAt: new Date(payment.createdAt),
        updatedAt: new Date(payment.updatedAt),
        
        // CRITICAL CHANGE: Set payoutId to NULL to avoid foreign key issues
        payoutId: null
      }));
      
      // Insert the transformed data
      await queryInterface.bulkInsert('Payments', transformedData, {});
      
      console.log('Payments seeded successfully');
    } catch (error) {
      console.error('Error seeding Payments:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Payments', null, {});
  }
};