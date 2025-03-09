'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION update_modified_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updatedAt" = now();
        RETURN NEW;
      END;
      $$ LANGUAGE 'plpgsql';
    `);

    const tables = [
      'Users',
      'UserAddresses',
      'ServiceCategories',
      'ServiceSubcategories',
      'ServiceProviderProfiles',
      'ProviderServices',
      'PortfolioItems',
      'Bookings',
      'Transactions',
      'Invoices',
      'Reviews',
      'Messages',
      'Notifications',
      'DeviceTokens',
      'PaymentMethods',
      'SubscriptionPlans',
    ];

    for (const table of tables) {
      await queryInterface.sequelize.query(`
        CREATE TRIGGER update_${table}_modtime
        BEFORE UPDATE ON "${table}"
        FOR EACH ROW
        EXECUTE PROCEDURE update_modified_column();
      `);
    }
  },
  down: async (queryInterface, Sequelize) => {
    const tables = [
      'Users',
      'UserAddresses',
      'ServiceCategories',
      'ServiceSubcategories',
      'ServiceProviderProfiles',
      'ProviderServices',
      'PortfolioItems',
      'Bookings',
      'Transactions',
      'Invoices',
      'Reviews',
      'Messages',
      'Notifications',
      'DeviceTokens',
      'PaymentMethods',
      'SubscriptionPlans',
    ];

    for (const table of tables) {
      await queryInterface.sequelize.query(`
        DROP TRIGGER IF EXISTS update_${table}_modtime ON "${table}";
      `);
    }

    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS update_modified_column;
    `);
  },
};