'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Read the original payment data with the correct payoutIds
      const paymentsData = JSON.parse(
        fs.readFileSync(
          path.join(__dirname, '../data/payments.json'), 
          'utf8'
        )
      );
      
      // For each payment that has a payoutId, update it in the database
      for (const payment of paymentsData) {
        if (payment.payoutId) {
          await queryInterface.sequelize.query(`
            UPDATE "Payments" 
            SET "payoutId" = '${payment.payoutId}' 
            WHERE id = '${payment.id}'
          `);
        }
      }
      
      console.log('Payment-Payout relationships updated successfully');
    } catch (error) {
      console.error('Error updating payment-payout relationships:', error);
      throw error;
    }
  },
  
  async down(queryInterface, Sequelize) {
    // Reset all payoutId values to null
    await queryInterface.sequelize.query(`
      UPDATE "Payments" SET "payoutId" = NULL
    `);
  }
};