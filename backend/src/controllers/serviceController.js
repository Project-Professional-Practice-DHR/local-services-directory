const { Service, ServiceCategory, ServiceProviderProfile, User, Booking } = require('../models');
const { Op } = require('sequelize');

// Get all services with pagination and filtering
exports.getServices = async (req, res) => {
  try {
    const {
      serviceCategoryId,
      minPrice,
      maxPrice,
      search,
      sort = 'newest',
      limit = 10,
      offset = 0
    } = req.query;

    // Build where clause
    const whereClause = { isActive: true };
    
    if (serviceCategoryId) {
      whereClause.serviceCategoryId = serviceCategoryId;
    }
    
    if (minPrice) {
      whereClause.price = { ...whereClause.price, [Op.gte]: parseFloat(minPrice) };
    }
    
    if (maxPrice) {
      whereClause.price = { ...(whereClause.price || {}), [Op.lte]: parseFloat(maxPrice) };
    }
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Determine sort order
    let order;
    switch (sort) {
      case 'price_asc':
        order = [['price', 'ASC']];
        break;
      case 'price_desc':
        order = [['price', 'DESC']];
        break;
      case 'rating':
        order = [['rating', 'DESC']];
        break;
      case 'oldest':
        order = [['createdAt', 'ASC']];
        break;
      case 'newest':
      default:
        order = [['createdAt', 'DESC']];
    }

    const services = await Service.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: ServiceCategory,
          as: 'category',
          attributes: ['id', 'name', 'icon']
        },
        {
          model: ServiceProviderProfile,
          as: 'provider',
          attributes: ['id', 'businessName', 'description'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName', 'profilePicture']
            }
          ]
        }
      ],
      order,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      success: true,
      count: services.count,
      services: services.rows
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching services',
      error: error.message
    });
  }
};

// Get a single service by ID
exports.getService = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findByPk(id, {
      include: [
        {
          model: ServiceCategory,
          as: 'category'
        },
        {
          model: ServiceProviderProfile,
          as: 'provider',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName', 'profileImage']
            }
          ]
        }
      ]
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.status(200).json({
      success: true,
      service
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching service',
      error: error.message
    });
  }
};

// Create a new service
exports.createService = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      serviceCategoryId,
      isActive = true
    } = req.body;

    // Get provider ID from authenticated user
    const providerId = req.user.providerId || req.user.id;

    // Create the service
    const service = await Service.create({
      name,
      description,
      price,
      serviceCategoryId,
      providerId,
      isActive
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      service
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating service',
      error: error.message
    });
  }
};

// Update a service
exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      serviceCategoryId,
      isActive
    } = req.body;

    // Find the service
    const service = await Service.findByPk(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check if user is the service provider
    if (service.providerId !== req.user.providerId && service.providerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only update your own services'
      });
    }

    // Update the service
    await service.update({
      name: name || service.name,
      description: description || service.description,
      price: price || service.price,
      serviceCategoryId: serviceCategoryId || service.serviceCategoryId,
      isActive: isActive !== undefined ? isActive : service.isActive
    });

    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      service
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating service',
      error: error.message
    });
  }
};

// Delete a service
exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the service
    const service = await Service.findByPk(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check if user is the service provider
    if (service.providerId !== req.user.providerId && service.providerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only delete your own services'
      });
    }

    // Delete the service
    await service.destroy();

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting service',
      error: error.message
    });
  }
};

// Get services by provider ID
exports.getProviderServices = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { includeInactive = false } = req.query;

    // Build where clause
    const whereClause = { providerId };
    
    // Only admins or the provider themselves can see inactive services
    if (!includeInactive || (req.user.id !== providerId && req.user.role !== 'admin')) {
      whereClause.isActive = true;
    }

    const services = await Service.findAll({
      where: whereClause,
      include: [
        {
          model: ServiceCategory,
          as: 'category'
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      services
    });
  } catch (error) {
    console.error('Error fetching provider services:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching provider services',
      error: error.message
    });
  }
};

// Get services for the authenticated provider
exports.getMyServices = async (req, res) => {
  try {
    const providerId = req.user.providerId || req.user.id;
    const { includeInactive = true, sort = 'newest' } = req.query;

    // Build where clause
    const whereClause = { providerId };
    if (!includeInactive) {
      whereClause.isActive = true;
    }

    // Determine sort order
    let order;
    switch (sort) {
      case 'price_asc':
        order = [['price', 'ASC']];
        break;
      case 'price_desc':
        order = [['price', 'DESC']];
        break;
      case 'popularity':
        order = [['bookingCount', 'DESC']];
        break;
      case 'oldest':
        order = [['createdAt', 'ASC']];
        break;
      case 'newest':
      default:
        order = [['createdAt', 'DESC']];
    }

    const services = await Service.findAll({
      where: whereClause,
      include: [
        {
          model: ServiceCategory,
          as: 'category'
        },
        {
          model: Booking,
          as: 'bookings',
          attributes: ['id', 'status', 'bookingDate'],
          required: false
        }
      ],
      order
    });

    res.status(200).json({
      success: true,
      services
    });
  } catch (error) {
    console.error('Error fetching my services:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching my services',
      error: error.message
    });
  }
};

// Search for services with filtering
exports.searchServices = async (req, res) => {
  try {
    const {
      keyword,
      ServiceCategoryId,
      minPrice,
      maxPrice,
      location,
      sort = 'newest',
      page = 1,
      limit = 20
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = { isActive: true };
    
    // Add filters to where clause
    if (keyword) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${keyword}%` } },
        { description: { [Op.iLike]: `%${keyword}%` } }
      ];
    }
    
    if (ServiceCategoryId) {
      whereClause.serviceCategoryId = ServiceCategoryId;
    }
    
    if (minPrice) {
      whereClause.price = { ...whereClause.price, [Op.gte]: parseFloat(minPrice) };
    }
    
    if (maxPrice) {
      whereClause.price = { 
        ...(whereClause.price || {}), 
        [Op.lte]: parseFloat(maxPrice) 
      };
    }
    
    // Location-based search logic could be added here
    
    // Determine sort order
    let order;
    switch (sort) {
      case 'price_asc':
        order = [['price', 'ASC']];
        break;
      case 'price_desc':
        order = [['price', 'DESC']];
        break;
      case 'rating':
        order = [['rating', 'DESC']];
        break;
      case 'newest':
      default:
        order = [['createdAt', 'DESC']];
    }

    const services = await Service.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset,
      include: [
        {
          model: ServiceCategory,
          as: 'category'
        },
        {
          model: ServiceProviderProfile,
          as: 'provider',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName', 'profileImage']
            }
          ]
        }
      ],
      order
    });

    res.status(200).json({
      success: true,
      count: services.count,
      totalPages: Math.ceil(services.count / parseInt(limit)),
      currentPage: parseInt(page),
      services: services.rows
    });
  } catch (error) {
    console.error('Error searching services:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching services',
      error: error.message
    });
  }
};

// Get featured services
exports.getFeaturedServices = async (req, res) => {
  try {
    const featuredServices = await Service.findAll({
      where: { 
        isActive: true,
        isFeatured: true
      },
      include: [
        {
          model: ServiceCategory,
          as: 'category'
        },
        {
          model: ServiceProviderProfile,
          as: 'provider',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName', 'profileImage']
            }
          ]
        }
      ],
      limit: 10,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      services: featuredServices
    });
  } catch (error) {
    console.error('Error fetching featured services:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured services',
      error: error.message
    });
  }
};

// Updated import function that handles both JSON formats

// Import services from JSON file
exports.importServicesFromJSON = async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const { sequelize, Service, ServiceCategory, ServiceProviderProfile, User } = require('../models');
    
    // Get file path from request or use default
    const sourcePath = req.query.source || 'backend';
    let filePath;
    
    if (sourcePath === 'frontend') {
      filePath = path.join(__dirname, '../../../frontend/src/mock/Services.json');
    } else {
      filePath = path.join(__dirname, '../../src/data/services.json');
    }
    
    console.log(`Importing services from: ${filePath}`);
    
    // Read and parse the JSON data
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Start a transaction
    const t = await sequelize.transaction();
    
    try {
      // Determine which JSON format we're dealing with
      const isDetailedFormat = Array.isArray(jsonData);
      const isStandardFormat = !isDetailedFormat && jsonData.services && jsonData.categories;
      
      if (!isDetailedFormat && !isStandardFormat) {
        throw new Error('Unrecognized JSON format');
      }
      
      // CASE 1: Detailed format (paste-2.txt)
      if (isDetailedFormat) {
        console.log('Importing detailed format services...');
        
        // Get unique category IDs from the services
        const categoryIds = [...new Set(jsonData.map(service => service.serviceCategoryId))];
        
        // Ensure all categories exist
        for (const categoryId of categoryIds) {
          await ServiceCategory.findOrCreate({
            where: { id: categoryId },
            defaults: {
              name: `Category ${categoryId.substring(0, 6)}`, // Generate a name if needed
              description: 'Imported category',
              icon: 'default-icon'
            },
            transaction: t
          });
        }
        
        // Get unique provider IDs from the services
        const providerIds = [...new Set(jsonData.map(service => service.providerId))];
        
        // Ensure all providers exist
        for (const providerId of providerIds) {
          const existingProvider = await ServiceProviderProfile.findOne({
            where: { id: providerId },
            transaction: t
          });
          
          if (!existingProvider) {
            // Create a user for this provider if needed
            const defaultUser = await User.findOrCreate({
              where: { email: `provider-${providerId.substring(0, 6)}@example.com` },
              defaults: {
                firstName: 'Provider',
                lastName: providerId.substring(0, 6),
                password: 'securePassword123', // You should hash this in a real app
                role: 'provider'
              },
              transaction: t
            });
            
            // Create the provider profile
            await ServiceProviderProfile.create({
              id: providerId,
              userId: defaultUser[0].id,
              businessName: `Provider ${providerId.substring(0, 6)}`,
              description: 'Imported service provider',
              isVerified: true
            }, { transaction: t });
          }
        }
        
        // Import services
        for (const service of jsonData) {
          await Service.create({
            id: service.id,
            name: service.name,
            description: service.description,
            price: service.price,
            pricingType: service.pricingType || 'fixed',
            duration: service.duration || 60,
            isActive: service.hasOwnProperty('isActive') ? service.isActive : true,
            providerId: service.providerId,
            serviceCategoryId: service.serviceCategoryId,
            createdAt: service.createdAt || new Date(),
            updatedAt: service.updatedAt || new Date()
          }, { transaction: t });
        }
      } 
      // CASE 2: Standard format (paste.txt with categories and services)
      else if (isStandardFormat) {
        console.log('Importing standard format services with categories...');
        
        // Import categories first
        for (const category of jsonData.categories) {
          await ServiceCategory.findOrCreate({
            where: { name: category.name },
            defaults: {
              description: category.description,
              icon: 'default-icon' // Set a default icon or extract from your JSON
            },
            transaction: t
          });
        }
        
        // Get all categories to map names to IDs
        const categories = await ServiceCategory.findAll({
          transaction: t
        });
        
        const categoryMap = {};
        categories.forEach(category => {
          categoryMap[category.name] = category.id;
        });
        
        // Find or create a default provider for these services
        let defaultProvider = await ServiceProviderProfile.findOne({
          where: { businessName: 'Default Provider' },
          transaction: t
        });
        
        if (!defaultProvider) {
          // First find or create a user for the provider
          const defaultUser = await User.findOrCreate({
            where: { email: 'default@example.com' },
            defaults: {
              firstName: 'Default',
              lastName: 'Provider',
              password: 'securePassword123', // You should hash this in a real app
              role: 'provider'
            },
            transaction: t
          });
          
          defaultProvider = await ServiceProviderProfile.create({
            userId: defaultUser[0].id,
            businessName: 'Default Provider',
            description: 'Default provider for imported services',
            isVerified: true
          }, { transaction: t });
        }
        
        // Import services
        for (const service of jsonData.services) {
          // Extract numeric price from price string (e.g., "£25 per hour" -> 25)
          const priceMatch = service.price.match(/[0-9]+(\.[0-9]+)?/);
          const price = priceMatch ? parseFloat(priceMatch[0]) : 0;
          
          // Find the category ID for this service
          const categoryId = categoryMap[service.category];
          
          if (!categoryId) {
            console.warn(`Category not found for service: ${service.name}`);
            continue;
          }
          
          // Create the service
          const createdService = await Service.create({
            name: service.name,
            description: service.description,
            price,
            pricingType: 'hourly', // Default since prices are per hour in this format
            duration: 60, // Default duration in minutes
            providerId: defaultProvider.id,
            serviceCategoryId: categoryId,
            isActive: true,
            rating: service.rating || 0,
            reviewCount: service.reviewCount || 0
          }, { transaction: t });
          
          // Store additional fields in a separate table or as JSON if you have
          // a features field in your Service model
          if (service.features || service.contactInfo) {
            await createdService.update({
              featuresJson: service.features ? JSON.stringify(service.features) : null,
              contactInfoJson: service.contactInfo ? JSON.stringify(service.contactInfo) : null
            }, { transaction: t });
          }
        }
        
        // Import related services if your model supports it
        if (jsonData.relatedServices) {
          for (const [serviceId, relatedIds] of Object.entries(jsonData.relatedServices)) {
            const service = await Service.findOne({
              where: { name: jsonData.services.find(s => s.id === serviceId)?.name },
              transaction: t
            });
            
            if (service) {
              for (const relatedId of relatedIds) {
                const relatedService = await Service.findOne({
                  where: { name: jsonData.services.find(s => s.id === relatedId.toString())?.name },
                  transaction: t
                });
                
                if (relatedService) {
                  // If you have a RelatedService model or a way to store relations:
                  // await RelatedService.create({
                  //   serviceId: service.id,
                  //   relatedServiceId: relatedService.id
                  // }, { transaction: t });
                  
                  // Alternatively, if your Service model has a relatedServiceIds field:
                  // const currentRelated = service.relatedServiceIds || [];
                  // if (!currentRelated.includes(relatedService.id)) {
                  //   await service.update({
                  //     relatedServiceIds: [...currentRelated, relatedService.id]
                  //   }, { transaction: t });
                  // }
                  
                  // Comment in the appropriate code based on your model structure
                }
              }
            }
          }
        }
      }
      
      // Commit transaction
      await t.commit();
      
      res.status(200).json({
        success: true,
        message: 'Services imported successfully',
        source: sourcePath,
        format: isDetailedFormat ? 'detailed' : 'standard'
      });
    } catch (error) {
      // Roll back transaction in case of error
      await t.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error importing services:', error);
    res.status(500).json({
      success: false,
      message: 'Error importing services',
      error: error.message
    });
  }
};