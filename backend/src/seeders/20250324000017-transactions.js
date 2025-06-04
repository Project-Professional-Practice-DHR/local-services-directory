'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Read the JSON data
      const data = JSON.parse(
        fs.readFileSync(
          path.join(__dirname, '../data/transactions.json'),
          'utf8'
        )
      );
      
      // Process the data to handle any complex fields
      const processedData = data.map(transaction => {
        // Create a new object with processed fields
        const processedTransaction = {
          ...transaction
        };
        
        // Handle potential JSON fields
        if (transaction.metadata) {
          processedTransaction.metadata = JSON.stringify(transaction.metadata);
        }
        
        if (transaction.paymentDetails) {
          processedTransaction.paymentDetails = JSON.stringify(transaction.paymentDetails);
        }
        
        if (transaction.items) {
          processedTransaction.items = JSON.stringify(transaction.items);
        }
        
        if (transaction.fees) {
          processedTransaction.fees = JSON.stringify(transaction.fees);
        }
        
        // Ensure dates are properly formatted
        if (transaction.createdAt) {
          processedTransaction.createdAt = new Date(transaction.createdAt);
        }
        
        if (transaction.updatedAt) {
          processedTransaction.updatedAt = new Date(transaction.updatedAt);
        }
        
        if (transaction.processedAt) {
          processedTransaction.processedAt = transaction.processedAt ? new Date(transaction.processedAt) : null;
        }
        
        if (transaction.refundedAt) {
          processedTransaction.refundedAt = transaction.refundedAt ? new Date(transaction.refundedAt) : null;
        }
        
        return processedTransaction;
      });
      
      // Insert the processed data
      await queryInterface.bulkInsert('Transactions', processedData, {});
      
      console.log('Transactions seeded successfully');
    } catch (error) {
      console.error('Error seeding Transactions:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Transactions', null, {});
  }
};