// File: src/routes/api/search.js

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middleware/auth');
const { User, Service, Category, sequelize } = require('../../models');
const { Op, literal } = require('sequelize');

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Search endpoints
 */

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Search for service providers
 *     description: Search for service providers based on multiple criteria
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Category ID to filter by
 *       - in: query
 *         name: subcategory
 *         schema:
 *           type: string
 *         description: Subcategory ID to filter by
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Search keyword
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         description: Latitude for location-based search
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *         description: Longitude for location-based search
 *       - in: query
 *         name: distance
 *         schema:
 *           type: number
 *           default: 10
 *         description: Search radius in kilometers
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *         description: Minimum provider rating
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum service price
 *       - in: query
 *         name: minExperience
 *         schema:
 *           type: number
 *         description: Minimum years of experience
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [rating, distance, price]
 *           default: rating
 *         description: Sort by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Results per page
 *     responses:
 *       200:
 *         description: Search results
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    // Extract search parameters from query
    const {
      category,
      subcategory,
      keyword,
      lat,
      lng,
      distance = 10, // default 10 km radius
      minRating,
      maxPrice,
      minExperience,
      sortBy = 'rating', // default sort by rating
      sortOrder = 'desc', // default descending
      page = 1,
      limit = 10
    } = req.query;

    // Base query for providers
    let providerWhere = {
      role: 'provider',
      isActive: true
    };

    // Filter by rating
    if (minRating) {
      providerWhere.rating = { [Op.gte]: parseFloat(minRating) };
    }

    // Filter by experience
    if (minExperience) {
      providerWhere.experienceYears = { [Op.gte]: parseInt(minExperience) };
    }

    // Build service query for price filtering
    let serviceWhere = {};
    if (maxPrice) {
      serviceWhere.price = { [Op.lte]: parseFloat(maxPrice) };
    }

    // Category and subcategory filtering
    if (category) {
      serviceWhere.serviceCategoryId = category;
    }

    if (subcategory) {
      serviceWhere.subcategoryId = subcategory;
    }

    // Keyword search across multiple fields
    if (keyword) {
      const keywordFilter = { [Op.iLike]: `%${keyword}%` };
      providerWhere = {
        ...providerWhere,
        [Op.or]: [
          { firstName: keywordFilter },
          { lastName: keywordFilter },
          { businessName: keywordFilter },
          { description: keywordFilter }
        ]
      };
      
      // Also search in service names and descriptions
      if (Object.keys(serviceWhere).length === 0) {
        // Only add OR condition if we don't have other service filters
        serviceWhere = {
          [Op.or]: [
            { name: keywordFilter },
            { description: keywordFilter }
          ]
        };
      } else {
        // If we already have service filters, add keyword filter to each
        serviceWhere = {
          ...serviceWhere,
          [Op.or]: [
            { name: keywordFilter },
            { description: keywordFilter }
          ]
        };
      }
    }

    // Location-based search using Sequelize's Haversine calculation
    let distanceSelect = null;
    let havingClause = {};
    
    if (lat && lng) {
      // Calculate distance using Haversine formula (directly in SQL)
      distanceSelect = literal(`
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
      
      // Add having clause to filter by distance
      havingClause = { distance: { [Op.lte]: parseFloat(distance) } };
    }
    
    // Calculate offset for pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Prepare our findAndCountAll options with proper includes
    const findOptions = {
      where: providerWhere,
      include: [
        {
          model: Service,
          as: 'services',
          where: Object.keys(serviceWhere).length > 0 ? serviceWhere : undefined,
          required: Object.keys(serviceWhere).length > 0 // Make join required only if we have service filters
        }
      ],
      limit: parseInt(limit),
      offset,
      distinct: true, // Important for correct count with associations
      subQuery: false // Improve performance for complex queries
    };

    // Add attributes with distance calculation if location search
    if (distanceSelect) {
      findOptions.attributes = {
        include: [[distanceSelect, 'distance']]
      };
      findOptions.having = havingClause;
    }
    
    // Configure sorting based on sortBy parameter
    const order = [];
    
    if (sortBy === 'distance' && distanceSelect) {
      order.push([literal('distance'), sortOrder]);
    } else if (sortBy === 'price') {
      // For price sorting we need to join with services and find minimum price
      // This requires a more complex query that might need to be custom-built with raw SQL
      // For simplicity, we'll sort by name as a fallback here
      order.push(['firstName', sortOrder]);
    } else {
      // Default sorting by rating or name
      order.push([sortBy, sortOrder]);
    }
    
    findOptions.order = order;
    
    // Execute the query
    const { rows: providers, count } = await User.findAndCountAll(findOptions);
    
    res.json({
      serviceProviders: providers,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

/**
 * @swagger
 * /api/search/categories:
 *   get:
 *     summary: Get all categories
 *     description: Get all service categories with subcategories
 *     tags: [Search]
 *     responses:
 *       200:
 *         description: List of categories
 *       500:
 *         description: Server error
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['name', 'ASC']]
    });
    
    res.json(categories);
  } catch (err) {
    console.error('Category fetch error:', err.message);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

/**
 * @swagger
 * /api/search/trending:
 *   get:
 *     summary: Get trending providers
 *     description: Get trending/popular service providers
 *     tags: [Search]
 *     responses:
 *       200:
 *         description: List of trending providers
 *       500:
 *         description: Server error
 */
router.get('/trending', async (req, res) => {
  try {
    // Get service providers sorted by booking count or rating
    const trendingProviders = await User.findAll({
      where: {
        role: 'provider',
        isActive: true,
        isVerified: true,
        rating: { [Op.gte]: 4.0 } // Minimum 4-star rating
      },
      order: [
        ['bookingCount', 'DESC'],
        ['rating', 'DESC']
      ],
      limit: 10,
      include: [
        {
          model: Service,
          as: 'services',
          attributes: ['id', 'name', 'price', 'serviceCategoryId'],
          limit: 3 // Limit to 3 services per provider
        }
      ]
    });

    res.json(trendingProviders);
  } catch (err) {
    console.error('Trending fetch error:', err.message);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

/**
 * @swagger
 * /api/search/suggestion:
 *   get:
 *     summary: Get personalized suggestions
 *     description: Get service provider suggestions based on user history
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of suggested providers
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/suggestion', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Build suggestion logic here
    // This is a simple example - in a real app, you'd use past bookings, user preferences, etc.
    const suggestedProviders = await User.findAll({
      where: {
        role: 'provider',
        isActive: true,
        isVerified: true,
        rating: { [Op.gte]: 4.5 } // High-rated providers
      },
      order: [
        ['rating', 'DESC']
      ],
      limit: 5,
      include: [
        {
          model: Service,
          as: 'services',
          attributes: ['id', 'name', 'price', 'serviceCategoryId'],
          limit: 2
        }
      ]
    });
    
    res.json({
      suggestions: suggestedProviders
    });
  } catch (err) {
    console.error('Suggestion error:', err.message);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

module.exports = router;