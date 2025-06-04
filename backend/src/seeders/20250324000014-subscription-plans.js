'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Read the JSON data
      const data = JSON.parse(
        fs.readFileSync(
          path.join(__dirname, '../data/subscription-plans.json'),
          'utf8'
        )
      );
      
      // Process the data to handle any complex fields
      const processedData = data.map(plan => {
        // Create a new object with processed fields
        const processedPlan = {
          ...plan
        };
        
        // Handle potential JSON fields like features, pricing tiers, etc.
        if (plan.features) {
          processedPlan.features = JSON.stringify(plan.features);
        }
        
        if (plan.pricingTiers) {
          processedPlan.pricingTiers = JSON.stringify(plan.pricingTiers);
        }
        
        if (plan.metadata) {
          processedPlan.metadata = JSON.stringify(plan.metadata);
        }
        
        // Ensure dates are properly formatted
        if (plan.createdAt) {
          processedPlan.createdAt = new Date(plan.createdAt);
        }
        
        if (plan.updatedAt) {
          processedPlan.updatedAt = new Date(plan.updatedAt);
        }
        
        return processedPlan;
      });
      
      // Insert the processed data
      await queryInterface.bulkInsert('SubscriptionPlans', processedData, {});
      
      console.log('SubscriptionPlans seeded successfully');
    } catch (error) {
      console.error('Error seeding SubscriptionPlans:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('SubscriptionPlans', null, {});
  }
};