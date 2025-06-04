// Save this file as 'scripts/updated-services-migration.js'
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Connect to models
const modelsPath = path.join(__dirname, '../backend/src/models');
console.log(`Looking for models at: ${modelsPath}`);

let models;
try {
  models = require(modelsPath);
  console.log('Models loaded successfully');
} catch (err) {
  console.error(`Could not load models from ${modelsPath}:`, err.message);
  process.exit(1);
}

const { Service, ServiceCategory, ServiceProviderProfile, User } = models;

async function migrateServicesData() {
  console.log('Starting services data migration...');

  try {
    // Load JSON data
    const mockDataPath = path.join(__dirname, '../frontend/src/mock/Services.json');
    console.log(`Reading mock data from: ${mockDataPath}`);
    
    if (!fs.existsSync(mockDataPath)) {
      throw new Error(`Mock data file not found at ${mockDataPath}`);
    }
    
    const fileContent = fs.readFileSync(mockDataPath, 'utf8');
    const jsonData = JSON.parse(fileContent);
    
    if (!jsonData.services || !jsonData.categories) {
      throw new Error('Invalid mock data format: missing services or categories');
    }
    
    console.log(`Found ${jsonData.services.length} services and ${jsonData.categories.length} categories`);
    
    // Start a transaction
    const transaction = await models.sequelize.transaction();
    
    try {
      // Step 1: Get existing user or create a new one with a unique email
      console.log('Looking for existing user...');
      
      // First try to find the provider user
      let defaultUser = await User.findOne({
        where: { role: 'provider' },
        transaction
      });
      
      if (!defaultUser) {
        console.log('No provider user found, creating one with unique email...');
        
        // Generate a unique email
        const uniqueEmail = `provider_${Date.now()}@example.com`;
        
        defaultUser = await User.create({
          username: `service_provider_${Date.now()}`,
          firstName: 'Service',
          lastName: 'Provider',
          email: uniqueEmail,
          password: 'password123',
          role: 'provider'
        }, { transaction });
        
        console.log(`Created new user with ID: ${defaultUser.id} and email: ${uniqueEmail}`);
      } else {
        console.log(`Using existing user with ID: ${defaultUser.id} and email: ${defaultUser.email}`);
      }
      
      // Step 2: Find or create provider profile
      console.log('Looking for provider profile...');
      let defaultProvider = await ServiceProviderProfile.findOne({
        where: { userId: defaultUser.id },
        transaction
      });
      
      if (!defaultProvider) {
        console.log('Creating provider profile...');
        defaultProvider = await ServiceProviderProfile.create({
          businessName: 'Default Provider',
          description: 'Provider for imported services',
          userId: defaultUser.id
        }, { transaction });
        
        console.log(`Created provider profile with ID: ${defaultProvider.id}`);
      } else {
        console.log(`Using existing provider profile with ID: ${defaultProvider.id}`);
      }
      
      // Step 3: Create all categories
      console.log('Creating categories...');
      const categoryMap = {};
      
      for (const category of jsonData.categories) {
        const [newCategory] = await ServiceCategory.findOrCreate({
          where: { name: category.name },
          defaults: {
            name: category.name,
            description: category.description,
            icon: category.id // Store category ID in icon field if needed
          },
          transaction
        });
        
        categoryMap[category.name] = newCategory.id;
        console.log(`Category created/found: ${category.name} with ID: ${newCategory.id}`);
      }
      
      // Step 4: Create all services
      console.log('Creating services...');
      let successCount = 0;
      let errorCount = 0;
      
      for (const service of jsonData.services) {
        try {
          // Get category ID
          const categoryId = categoryMap[service.category];
          if (!categoryId) {
            console.warn(`Warning: Category not found for service: ${service.name}`);
            continue;
          }
          
          // Extract numeric price
          let price = 0;
          if (service.price) {
            const priceMatch = service.price.match(/\d+(\.\d+)?/);
            if (priceMatch) {
              price = parseFloat(priceMatch[0]);
            }
          }
          
          // Create UUID for service if needed
          const serviceId = service.id.length >= 36 ? service.id : uuidv4();
          
          // Create the service
          const [serviceRecord, created] = await Service.findOrCreate({
            where: { id: serviceId },
            defaults: {
              id: serviceId,
              name: service.name,
              description: service.description,
              price: price,
              providerId: defaultProvider.id,
              serviceCategoryId: categoryId,
              image: service.image || '/default-image.jpg',
              rating: service.rating || 5.0,
              reviewCount: service.reviewCount || 0
            },
            transaction
          });
          
          if (created) {
            successCount++;
            console.log(`Service created: ${service.name} with ID: ${serviceId}`);
          } else {
            console.log(`Service already exists: ${service.name} with ID: ${serviceId}`);
          }
        } catch (serviceError) {
          errorCount++;
          console.error(`Error creating service ${service.name}:`, serviceError.message);
        }
      }
      
      // Special handling for our problematic service
      const problemId = '5e47d12b-bf49-4d2c-8353-b56a60fe1eb2';
      console.log(`Checking for problematic service ID: ${problemId}`);
      
      const existingService = await Service.findByPk(problemId, { transaction });
      if (!existingService) {
        console.log('Creating special service entry for the problematic ID');
        
        // Get first category
        const firstCategory = await ServiceCategory.findOne({ transaction });
        if (!firstCategory) {
          throw new Error('No categories found. Cannot create service.');
        }
        
        await Service.create({
          id: problemId,
          name: 'Special Service',
          description: 'Created to fix foreign key constraint',
          price: 99.99,
          providerId: defaultProvider.id,
          serviceCategoryId: firstCategory.id,
          image: '/default-image.jpg',
          rating: 5.0,
          reviewCount: 0
        }, { transaction });
        
        console.log(`Created special service with ID: ${problemId}`);
        successCount++;
      } else {
        console.log('Problematic service ID already exists in database');
      }
      
      // Commit transaction
      await transaction.commit();
      console.log('Transaction committed successfully');
      console.log(`Migration completed: ${successCount} services created, ${errorCount} errors`);
      
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      console.error('Transaction rolled back due to error:', error);
      throw error;
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close database connection
    await models.sequelize.close();
    console.log('Database connection closed');
  }
}

// Run the migration
migrateServicesData()
  .then(() => {
    console.log('Migration process completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration process failed:', err);
    process.exit(1);
  });