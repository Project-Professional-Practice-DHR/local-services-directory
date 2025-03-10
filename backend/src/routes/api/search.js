// File: src/routes/api/search.js

const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const ServiceProvider = require('../../models/ServiceProvider');
const Service = require('../../models/Service');
const Category = require('../../models/Category');

/**
 * @route   GET api/search
 * @desc    Search for service providers based on multiple criteria
 * @access  Public
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

    // Base query
    let query = {};

    // Category-based filtering
    if (category) {
      query['services.category'] = category;
    }

    // Subcategory-based filtering
    if (subcategory) {
      query['services.subcategory'] = subcategory;
    }

    // Keyword search in name, description, or services
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { 'services.name': { $regex: keyword, $options: 'i' } },
        { 'services.description': { $regex: keyword, $options: 'i' } }
      ];
    }

    // Rating filter
    if (minRating) {
      query.averageRating = { $gte: parseFloat(minRating) };
    }

    // Experience filter
    if (minExperience) {
      query.experienceYears = { $gte: parseInt(minExperience) };
    }

    // Price filter - this assumes services have a price field
    let serviceQuery = {};
    if (maxPrice) {
      serviceQuery.price = { $lte: parseFloat(maxPrice) };
    }

    // Location-based search
    if (lat && lng) {
      // Add geospatial query
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(distance) * 1000 // convert km to meters
        }
      };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort options
    let sortOptions = {};
    if (sortBy === 'distance' && lat && lng) {
      // Distance sorting is handled by the $near operator
    } else if (sortBy === 'price') {
      // If sorting by price, we need to handle this differently as it's within the services array
      // This is a simplified approach - you might need aggregation for more complex scenarios
      sortOptions = { 'services.price': sortOrder === 'asc' ? 1 : -1 };
    } else {
      // Default sorting (rating, name, experience)
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    // Execute the query
    let serviceProviders = await ServiceProvider.find(query)
      .populate({
        path: 'services',
        match: serviceQuery
      })
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortOptions);

    // Filter out providers that have no matching services after population
    // This is needed when we filter by service properties
    if (Object.keys(serviceQuery).length > 0) {
      serviceProviders = serviceProviders.filter(provider => 
        provider.services && provider.services.length > 0
      );
    }

    // Calculate total for pagination
    const total = await ServiceProvider.countDocuments(query);

    res.json({
      serviceProviders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET api/search/categories
 * @desc    Get all categories with subcategories
 * @access  Public
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort('name');
    res.json(categories);
  } catch (err) {
    console.error('Category fetch error:', err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET api/search/trending
 * @desc    Get trending/popular service providers
 * @access  Public
 */
router.get('/trending', async (req, res) => {
  try {
    // Get service providers sorted by booking count or rating
    const trendingProviders = await ServiceProvider.find({
      isActive: true,
      isVerified: true,
      averageRating: { $gte: 4.0 } // Minimum 4-star rating
    })
      .sort({ bookingCount: -1, averageRating: -1 })
      .limit(10)
      .populate('services', 'name price category');

    res.json(trendingProviders);
  } catch (err) {
    console.error('Trending fetch error:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;