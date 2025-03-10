// File: src/controllers/searchController.js

const ServiceProvider = require('../models/ServiceProvider');
const Service = require('../models/Service');
const Category = require('../models/Category');

/**
 * Search for service providers with various filters
 */
exports.searchProviders = async (searchParams) => {
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
  } = searchParams;

  // Build query object
  let query = { isActive: true };

  // Category filtering
  if (category) {
    const categoryObj = await Category.findOne({ slug: category });
    if (categoryObj) {
      query['services.category'] = categoryObj._id;
    }
  }

  // Subcategory filtering
  if (subcategory) {
    const categoryObj = await Category.findOne({ 'subcategories.slug': subcategory });
    if (categoryObj) {
      const subcat = categoryObj.subcategories.find(sc => sc.slug === subcategory);
      if (subcat) {
        query['services.subcategory'] = subcat._id;
      }
    }
  }

  // Keyword search
  if (keyword) {
    // Use text index search if keyword is provided
    query.$text = { $search: keyword };
  }

  // Rating filter
  if (minRating) {
    query.averageRating = { $gte: parseFloat(minRating) };
  }

  // Experience filter
  if (minExperience) {
    query.experienceYears = { $gte: parseInt(minExperience) };
  }

  // Location-based search
  if (lat && lng) {
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

  // Price filter logic
  let serviceQuery = {};
  if (maxPrice) {
    serviceQuery.price = { $lte: parseFloat(maxPrice) };
  }

  // Prepare sort options
  let sortOptions = {};
  
  // Handle different sort options
  if (sortBy === 'distance' && lat && lng) {
    // Distance sorting happens automatically with $near
  } else if (sortBy === 'price') {
    // We need aggregation for proper price sorting
    // This is handled differently below
  } else {
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
  }

  // Pagination settings
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Execute main query
  let providers;
  
  // Special case for price sorting
  if (sortBy === 'price') {
    // For price sorting, we need an aggregation pipeline
    providers = await ServiceProvider.aggregate([
      { $match: query },
      { $lookup: {
          from: 'services',
          localField: 'services',
          foreignField: '_id',
          as: 'serviceDetails'
        }
      },
      // Filter based on service properties
      { $match: Object.keys(serviceQuery).length > 0 ? 
          { 'serviceDetails.price': serviceQuery.price } : {} 
      },
      // Get the minimum price for sorting
      { $addFields: {
          minPrice: { $min: '$serviceDetails.price' }
        }
      },
      // Sort by the minimum price
      { $sort: { minPrice: sortOrder === 'asc' ? 1 : -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);
    
    // Populate services for each provider (they're only IDs in the aggregation result)
    for (let provider of providers) {
      provider.services = await Service.find({
        _id: { $in: provider.services },
        ...serviceQuery
      });
      // Remove the added fields used for sorting
      delete provider.serviceDetails;
      delete provider.minPrice;
    }
  } else {
    // Regular search query
    providers = await ServiceProvider.find(query)
      .populate({
        path: 'services',
        match: serviceQuery,
        select: 'name description price pricingUnit duration images category subcategory'
      })
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortOptions);
      
    // Filter providers with no matching services
    providers = providers.filter(provider => 
      provider.services && provider.services.length > 0
    );
  }

  // Get total count for pagination
  const total = await ServiceProvider.countDocuments(query);

  return {
    providers,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit))
    }
  };
};

/**
 * Get trending service providers
 */
exports.getTrendingProviders = async (limit = 10) => {
  const trendingProviders = await ServiceProvider.find({
    isActive: true,
    isVerified: true,
    averageRating: { $gte: 4.0 }
  })
    .sort({ bookingCount: -1, averageRating: -1 })
    .limit(parseInt(limit))
    .populate({
      path: 'services',
      select: 'name price category',
      options: { limit: 3 } // Only get a few services per provider
    });

  return trendingProviders;
};

/**
 * Get service providers by category
 */
exports.getProvidersByCategory = async (categorySlug, limit = 10) => {
  const category = await Category.findOne({ slug: categorySlug });
  
  if (!category) {
    return [];
  }
  
  const providers = await ServiceProvider.find({
    isActive: true,
    'services.category': category._id
  })
    .sort({ averageRating: -1 })
    .limit(parseInt(limit))
    .populate({
      path: 'services',
      match: { category: category._id },
      select: 'name price'
    });
    
  return providers;
};

/**
 * Search for suggested providers based on user history or profile
 */
exports.getSuggestedProviders = async (userId, limit = 5) => {
  // This would integrate with a recommendation engine
  // For now, just return highly-rated providers
  const suggestedProviders = await ServiceProvider.find({
    isActive: true,
    isVerified: true,
    averageRating: { $gte: 4.5 }
  })
    .sort({ averageRating: -1 })
    .limit(parseInt(limit))
    .populate({
      path: 'services',
      select: 'name price category',
      options: { limit: 2 }
    });
    
  return suggestedProviders;
};