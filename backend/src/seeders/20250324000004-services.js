'use strict';
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

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

      // Check if we have the expected structure
      if (!data.services || !data.categories) {
        throw new Error('Invalid JSON format: Expected services and categories arrays');
      }

      // Step 1: Get existing categories from the database
      console.log('Fetching existing categories from database...');
      const existingCategories = await queryInterface.sequelize.query(
        `SELECT id, name FROM "ServiceCategories"`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      console.log('Existing categories:');
      existingCategories.forEach(cat => {
        console.log(`- ${cat.name} (${cat.id})`);
      });

      // Step 2: Create a mapping between JSON categories and DB categories
      // This is a manual mapping based on best match
      const categoryMapping = {
        // JSON category name => DB category id
        'Cleaning': existingCategories.find(c => c.name === 'Home Cleaning')?.id,
        'Electrician': existingCategories.find(c => c.name === 'Home Maintenance')?.id,
        'Plumbing': existingCategories.find(c => c.name === 'Home Maintenance')?.id,
        'Handyman': existingCategories.find(c => c.name === 'Home Maintenance')?.id,
        'Painting': existingCategories.find(c => c.name === 'Home Maintenance')?.id,
        'Carpentry': existingCategories.find(c => c.name === 'Home Maintenance')?.id,
        'Gardening': existingCategories.find(c => c.name === 'Home Maintenance')?.id,
        'HVAC': existingCategories.find(c => c.name === 'Home Maintenance')?.id,
        'Security': existingCategories.find(c => c.name === 'Home Maintenance')?.id,
        'Roofing': existingCategories.find(c => c.name === 'Home Maintenance')?.id,
        'Interior Design': existingCategories.find(c => c.name === 'Home Maintenance')?.id,
        'Appliance Repair': existingCategories.find(c => c.name === 'Home Maintenance')?.id,
        'Pest Control': existingCategories.find(c => c.name === 'Home Maintenance')?.id,
        'Moving': existingCategories.find(c => c.name === 'Home Maintenance')?.id,
        'Tech Support': existingCategories.find(c => c.name === 'Tech Repair')?.id,
        'Drywall': existingCategories.find(c => c.name === 'Home Maintenance')?.id,
        'Auto Services': existingCategories.find(c => c.name === 'Home Maintenance')?.id,
        'Photography': existingCategories.find(c => c.name === 'Event Planning')?.id,
        'Flooring': existingCategories.find(c => c.name === 'Home Maintenance')?.id,
        'Fitness': existingCategories.find(c => c.name === 'Fitness & Personal Training')?.id,
        'Gutter Services': existingCategories.find(c => c.name === 'Home Maintenance')?.id,
        'Pool Services': existingCategories.find(c => c.name === 'Home Maintenance')?.id,
        'Organization': existingCategories.find(c => c.name === 'Home Maintenance')?.id,
        'Tree Services': existingCategories.find(c => c.name === 'Home Maintenance')?.id,
        'Catering': existingCategories.find(c => c.name === 'Event Planning')?.id,
        'Fencing': existingCategories.find(c => c.name === 'Home Maintenance')?.id,
        'Event Planning': existingCategories.find(c => c.name === 'Event Planning')?.id,
        'Education': existingCategories.find(c => c.name === 'Tutoring & Education')?.id,
        'Wellness': existingCategories.find(c => c.name === 'Beauty & Wellness')?.id,
        'Pet Services': existingCategories.find(c => c.name === 'Pet Care')?.id,
        'Career Services': existingCategories.find(c => c.name === 'Tutoring & Education')?.id,
        'Solar Energy': existingCategories.find(c => c.name === 'Home Maintenance')?.id,
        'Culinary': existingCategories.find(c => c.name === 'Event Planning')?.id,
        'Financial Services': existingCategories.find(c => c.name === 'Tutoring & Education')?.id,
        'Real Estate': existingCategories.find(c => c.name === 'Home Maintenance')?.id,
        'Language Services': existingCategories.find(c => c.name === 'Tutoring & Education')?.id,
        'AV Services': existingCategories.find(c => c.name === 'Tech Repair')?.id,
        'Appliance Services': existingCategories.find(c => c.name === 'Home Maintenance')?.id,
        'Art Services': existingCategories.find(c => c.name === 'Event Planning')?.id,
        'Chimney Services': existingCategories.find(c => c.name === 'Home Maintenance')?.id,
        'Child Safety': existingCategories.find(c => c.name === 'Home Maintenance')?.id,
        'Seasonal Services': existingCategories.find(c => c.name === 'Home Maintenance')?.id
      };

      // Validate the mapping
      let validMappingCount = 0;
      let missingMappingCount = 0;
      Object.entries(categoryMapping).forEach(([jsonCategory, dbId]) => {
        if (dbId) {
          validMappingCount++;
        } else {
          missingMappingCount++;
          console.warn(`Warning: No mapping for JSON category "${jsonCategory}"`);
        }
      });

      console.log(`Category mapping: ${validMappingCount} valid mappings, ${missingMappingCount} missing`);

      // Step 3: Ensure we have a default service provider
      console.log('Checking for service provider...');
      const existingProviders = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as count FROM "ServiceProviderProfiles"`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      let defaultProviderId;
      
      if (existingProviders[0].count === 0) {
        console.log('Creating default user and service provider...');
        // First create a default user
        const defaultUserId = uuidv4();
        await queryInterface.bulkInsert('Users', [{
          id: defaultUserId,
          firstName: 'Default',
          lastName: 'Provider',
          email: 'provider@example.com',
          password: '$2a$10$abcdefghijklmnopqrstuvwxyz', // Placeholder hashed password
          role: 'provider',
          isVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }], {});
        
        // Then create provider profile
        defaultProviderId = uuidv4();
        await queryInterface.bulkInsert('ServiceProviderProfiles', [{
          id: defaultProviderId,
          userId: defaultUserId,
          businessName: 'Service Provider Company',
          description: 'Default provider for imported services',
          isVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }], {});
      } else {
        // Get the first available provider ID
        const provider = await queryInterface.sequelize.query(
          `SELECT id FROM "ServiceProviderProfiles" LIMIT 1`,
          { type: Sequelize.QueryTypes.SELECT }
        );
        defaultProviderId = provider[0].id;
        console.log(`Using existing provider with ID: ${defaultProviderId}`);
      }

      // Step 4: Transform the services data to match our schema
      console.log('Transforming service data...');
      const transformedServices = data.services.map(service => {
        // Extract numeric price from price string (e.g., "£25 per hour" -> 25)
        const priceMatch = service.price.match(/[0-9]+(\.[0-9]+)?/);
        const price = priceMatch ? parseFloat(priceMatch[0]) : 0;
        
        // Determine if price is hourly or fixed
        const pricingType = service.price.toLowerCase().includes('per hour') ? 'hourly' : 'fixed';
        
        // Get the mapped category ID
        const categoryId = categoryMapping[service.category];
        
        if (!categoryId) {
          console.warn(`Warning: No category mapping for service "${service.name}" with category "${service.category}"`);
        }
        
        return {
          id: uuidv4(),
          name: service.name,
          description: service.description,
          price: price,
          pricingType: pricingType,
          duration: 60, // Default duration in minutes
          isActive: true,
          isFeatured: parseInt(service.id) <= 5, // Feature the first 5 services
          rating: service.rating || 0,
          bookingCount: 0,
          serviceCategoryId: categoryId,
          providerId: defaultProviderId,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }).filter(service => service.serviceCategoryId); // Filter out services with missing category IDs

      console.log(`Prepared ${transformedServices.length} valid services for insertion`);
      
      // Check if we have any services to insert
      if (transformedServices.length === 0) {
        console.log('No valid services to insert. All services were filtered out due to missing category mappings.');
        return;
      }

      // Step 5: Insert services in chunks to avoid potential issues with large datasets
      const chunkSize = 50;
      for (let i = 0; i < transformedServices.length; i += chunkSize) {
        const chunk = transformedServices.slice(i, i + chunkSize);
        await queryInterface.bulkInsert('Services', chunk, {});
        console.log(`Inserted services ${i + 1} to ${Math.min(i + chunkSize, transformedServices.length)}`);
      }

      console.log(`Services seeded successfully - inserted ${transformedServices.length} services`);
    } catch (error) {
      console.error('Error seeding Services:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Delete all services
    await queryInterface.bulkDelete('Services', null, {});
    console.log('Services deleted');
  }
};