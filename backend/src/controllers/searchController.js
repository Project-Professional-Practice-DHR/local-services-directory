// File: src/controllers/searchController.js

const { User, Service, Category, sequelize } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

/**
 * Search for service providers with various filters
 */
exports.searchProviders = async (req, res) => {
  try {
    const {
      category,
      subcategory,
      keyword,
      lat,
      lng,
      distance = 10,
      minRating,
      maxPrice,
      minExperience,
      sortBy = 'rating',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // Build base query
    let query = {
      role: 'provider',
      isActive: true
    };

    // Category filtering
    if (category) {
      const categoryObj = await Category.findOne({ 
        where: { slug: category } 
      });
      
      if (categoryObj) {
        // Find all services in this category
        const services = await Service.findAll({
          where: { ServiceCategoryId: categoryObj.id },
          attributes: ['providerId'],
          raw: true
        });
        
        const providerIds = services.map(service => service.providerId);
        if (providerIds.length > 0) {
          query.id = { [Op.in]: providerIds };
        } else {
          // No providers with this category
          return res.status(200).json({
            providers: [],
            pagination: {
              total: 0,
              page: parseInt(page),
              limit: parseInt(limit),
              pages: 0
            }
          });
        }
      }
    }

    // Subcategory filtering
    if (subcategory) {
      const subcategoryObj = await Category.findOne({
        where: { 'subcategories.slug': subcategory },
        attributes: ['id'],
        raw: true
      });
      
      if (subcategoryObj) {
        // Find all services in this subcategory
        const services = await Service.findAll({
          where: { subcategoryId: subcategoryObj.id },
          attributes: ['providerId'],
          raw: true
        });
        
        const providerIds = services.map(service => service.providerId);
        if (providerIds.length > 0) {
          // Merge with existing ID filter if present
          if (query.id) {
            query.id = { [Op.in]: providerIds.filter(id => query.id[Op.in].includes(id)) };
          } else {
            query.id = { [Op.in]: providerIds };
          }
        } else {
          // No providers with this subcategory
          return res.status(200).json({
            providers: [],
            pagination: {
              total: 0,
              page: parseInt(page),
              limit: parseInt(limit),
              pages: 0
            }
          });
        }
      }
    }

    // Keyword search
    if (keyword) {
      query = {
        ...query,
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${keyword}%` } },
          { lastName: { [Op.iLike]: `%${keyword}%` } },
          { businessName: { [Op.iLike]: `%${keyword}%` } },
          { bio: { [Op.iLike]: `%${keyword}%` } }
        ]
      };
    }

    // Rating filter
    if (minRating) {
      query.rating = { [Op.gte]: parseFloat(minRating) };
    }

    // Experience filter
    if (minExperience) {
      query.experienceYears = { [Op.gte]: parseInt(minExperience) };
    }

    // Location-based search
    let distanceCalculation = null;
    if (lat && lng) {
      // Calculate distance using Haversine formula
      distanceCalculation = literal(`
        (
          6371 * acos(
            cos(radians(${parseFloat(lat)})) * 
            cos(radians(latitude)) * 
            cos(radians(longitude) - 
            radians(${parseFloat(lng)})) + 
            sin(radians(${parseFloat(lat)})) * 
            sin(radians(latitude))
          )
        )
      `);
    }

    // Price filter logic
    let serviceConditions = {};
    if (maxPrice) {
      // Find services below the price threshold
      const services = await Service.findAll({
        where: { price: { [Op.lte]: parseFloat(maxPrice) } },
        attributes: ['providerId'],
        raw: true
      });
      
      const providerIds = services.map(service => service.providerId);
      if (providerIds.length > 0) {
        // Merge with existing ID filter if present
        if (query.id) {
          query.id = { [Op.in]: providerIds.filter(id => query.id[Op.in].includes(id)) };
        } else {
          query.id = { [Op.in]: providerIds };
        }
      } else {
        // No providers with services below this price
        return res.status(200).json({
          providers: [],
          pagination: {
            total: 0,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: 0
          }
        });
      }
    }

    // Pagination settings
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Prepare attributes
    const attributes = [
      'id',
      'firstName',
      'lastName', 
      'businessName',
      'bio',
      'rating',
      'reviewCount',
      'experienceYears',
      'address',
      'latitude',
      'longitude'
    ];
    
    // Add distance calculation if location provided
    if (distanceCalculation) {
      attributes.push([distanceCalculation, 'distance']);
    }

    // Prepare order options
    let order = [];
    
    if (sortBy === 'distance' && distanceCalculation) {
      order.push([literal('distance'), sortOrder]);
    } else if (sortBy === 'price') {
      // For price sorting, we need a different approach
      // First get min price for each provider
      const providerMinPrices = await Service.findAll({
        attributes: [
          'providerId',
          [fn('MIN', col('price')), 'minPrice']
        ],
        group: ['providerId'],
        raw: true
      });
      
      // Create a map of provider ID to min price
      const priceMap = {};
      providerMinPrices.forEach(item => {
        priceMap[item.providerId] = parseFloat(item.minPrice);
      });
      
      // We'll sort the results after the query
      const sortPrice = (a, b) => {
        const priceA = priceMap[a.id] || Infinity;
        const priceB = priceMap[b.id] || Infinity;
        return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
      };
      
      // Use default sorting for the database query
      order.push(['rating', 'DESC']);
    } else {
      order.push([sortBy, sortOrder.toUpperCase()]);
    }

    // Execute main query
    let findOptions = {
      attributes,
      where: query,
      limit: parseInt(limit),
      offset,
      order
    };
    
    // Add having clause for distance if needed
    if (distanceCalculation && distance) {
      findOptions.having = literal(`distance <= ${parseFloat(distance)}`);
    }
    
    // Get providers
    const { count, rows: providers } = await User.findAndCountAll(findOptions);
    
    // Get services for each provider
    const providersWithServices = await Promise.all(providers.map(async (provider) => {
      const services = await Service.findAll({
        where: { 
          providerId: provider.id,
          ...serviceConditions 
        },
        attributes: ['id', 'name', 'description', 'price', 'duration', 'ServiceCategoryId', 'subcategoryId']
      });
      
      const providerData = provider.toJSON();
      providerData.services = services;
      
      // Format distance if available
      if (providerData.distance) {
        providerData.distance = {
          kilometers: providerData.distance,
          miles: providerData.distance * 0.621371,
          text: `${providerData.distance.toFixed(1)} km`
        };
      }
      
      return providerData;
    }));
    
    // Special sorting for price if needed
    const finalProviders = sortBy === 'price' 
      ? providersWithServices.sort(sortPrice)
      : providersWithServices;

    return res.status(200).json({
      providers: finalProviders,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Search providers error:', error);
    return res.status(500).json({ 
      message: 'Error searching for providers', 
      error: error.message 
    });
  }
};

/**
 * Get trending service providers
 */
exports.getTrendingProviders = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const providers = await User.findAll({
      where: {
        role: 'provider',
        isActive: true,
        isVerified: true,
        rating: { [Op.gte]: 4.0 }
      },
      order: [
        ['bookingCount', 'DESC'],
        ['rating', 'DESC']
      ],
      limit: parseInt(limit),
      include: [
        {
          model: Service,
          as: 'services',
          limit: 3,
          attributes: ['id', 'name', 'price', 'ServiceCategoryId']
        }
      ]
    });
    
    res.status(200).json({ providers });
  } catch (error) {
    console.error('Get trending providers error:', error);
    return res.status(500).json({ 
      message: 'Error fetching trending providers', 
      error: error.message 
    });
  }
};

/**
 * Get service providers by category
 */
exports.getProvidersByCategory = async (req, res) => {
  try {
    const { categorySlug, limit = 10 } = req.params;
    
    const category = await Category.findOne({
      where: { slug: categorySlug }
    });
    
    if (!category) {
      return res.status(200).json({ providers: [] });
    }
    
    // Find services in this category
    const services = await Service.findAll({
      where: { ServiceCategoryId: category.id },
      attributes: ['providerId'],
      raw: true
    });
    
    const providerIds = [...new Set(services.map(service => service.providerId))];
    
    if (providerIds.length === 0) {
      return res.status(200).json({ providers: [] });
    }
    
    // Find providers
    const providers = await User.findAll({
      where: {
        id: { [Op.in]: providerIds },
        role: 'provider',
        isActive: true
      },
      order: [['rating', 'DESC']],
      limit: parseInt(limit),
      include: [
        {
          model: Service,
          as: 'services',
          where: { categoryId: category.id },
          attributes: ['id', 'name', 'price']
        }
      ]
    });
    
    res.status(200).json({ providers });
  } catch (error) {
    console.error('Get providers by category error:', error);
    return res.status(500).json({ 
      message: 'Error fetching providers by category', 
      error: error.message 
    });
  }
};

/**
 * Get suggested providers based on user history
 */
exports.getSuggestedProviders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 5 } = req.query;
    
    // For a real recommendation engine, we'd analyze user bookings, views, etc.
    // For now, just return highly-rated providers
    const providers = await User.findAll({
      where: {
        role: 'provider',
        isActive: true,
        isVerified: true,
        rating: { [Op.gte]: 4.5 }
      },
      order: [['rating', 'DESC']],
      limit: parseInt(limit),
      include: [
        {
          model: Service,
          as: 'services',
          limit: 2,
          attributes: ['id', 'name', 'price', 'ServiceCategoryId']
        }
      ]
    });
    
    res.status(200).json({ providers });
  } catch (error) {
    console.error('Get suggested providers error:', error);
    return res.status(500).json({ 
      message: 'Error fetching suggested providers', 
      error: error.message 
    });
  }
};

/**
 * Search services
 */
exports.searchServices = async (req, res) => {
  try {
    const {
      keyword,
      ServiceCategoryId,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20
    } = req.query;
    
    // Build query
    let query = {};
    
    if (keyword) {
      query = {
        ...query,
        [Op.or]: [
          { name: { [Op.iLike]: `%${keyword}%` } },
          { description: { [Op.iLike]: `%${keyword}%` } }
        ]
      };
    }
    
    if (ServiceCategoryId) {
      query.ServiceCategoryId = ServiceCategoryId;
    }
    
    if (minPrice) {
      query.price = { ...query.price, [Op.gte]: parseFloat(minPrice) };
    }
    
    if (maxPrice) {
      query.price = { ...query.price, [Op.lte]: parseFloat(maxPrice) };
    }
    
    // Execute query
    const { count, rows: services } = await Service.findAndCountAll({
      where: query,
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'firstName', 'lastName', 'businessName', 'rating'],
          where: { isActive: true }
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }
      ],
      order: [['rating', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });
    
    res.status(200).json({
      services,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Search services error:', error);
    return res.status(500).json({ 
      message: 'Error searching for services', 
      error: error.message 
    });
  }
};