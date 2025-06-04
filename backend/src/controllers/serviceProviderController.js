const { User, ServiceProviderProfile, Service, Review } = require('../models');
const { Op, Sequelize } = require('sequelize');
const { Client } = require('@googlemaps/google-maps-services-js');

const googleMapsClient = new Client({});

// Create service provider profile
exports.createProfile = async (req, res) => {
  try {
    // Check if user already has a profile
    const existingProfile = await ServiceProviderProfile.findOne({
      where: { userId: req.user.id }
    });
    
    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: 'Profile already exists for this user'
      });
    }
    
    const {
      businessName,
      description,
      address,
      city,
      state,
      zipCode,
      website,
      businessHours
    } = req.body;
    
    // Get latitude and longitude from address
    let latitude = null;
    let longitude = null;
    
    try {
      const response = await googleMapsClient.geocode({
        params: {
          address: `${address}, ${city}, ${state} ${zipCode}`,
          key: process.env.GOOGLE_MAPS_API_KEY
        }
      });
      
      if (response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        latitude = location.lat;
        longitude = location.lng;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      // Continue without coordinates if geocoding fails
    }
    
    // Create profile
    const profile = await ServiceProviderProfile.create({
      businessName,
      description,
      address,
      city,
      state,
      zipCode,
      latitude,
      longitude,
      website,
      businessHours: businessHours || {},
      userId: req.user.id
    });
    
    // Update user role if it's currently 'customer'
    if (req.user.role === 'customer') {
      await User.update(
        { role: 'provider' },
        { where: { id: req.user.id } }
      );
    }
    
    res.status(201).json({
      success: true,
      message: 'Service provider profile created successfully',
      data: profile
    });
  } catch (error) {
    console.error('Create profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating service provider profile',
      error: error.message
    });
  }
};

// Update service provider profile
exports.updateProfile = async (req, res) => {
  try {
    const profile = await ServiceProviderProfile.findOne({
      where: { userId: req.user.id }
    });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    const {
      businessName,
      description,
      address,
      city,
      state,
      zipCode,
      website,
      businessHours
    } = req.body;
    
    // Update geocoding if address changed
    let latitude = profile.latitude;
    let longitude = profile.longitude;
    
    if (address || city || state || zipCode) {
      try {
        const fullAddress = `${address || profile.address}, ${city || profile.city}, ${state || profile.state} ${zipCode || profile.zipCode}`;
        
        const response = await googleMapsClient.geocode({
          params: {
            address: fullAddress,
            key: process.env.GOOGLE_MAPS_API_KEY
          }
        });
        
        if (response.data.results.length > 0) {
          const location = response.data.results[0].geometry.location;
          latitude = location.lat;
          longitude = location.lng;
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        // Continue with existing coordinates if geocoding fails
      }
    }
    
    // Update profile
    if (businessName) profile.businessName = businessName;
    if (description) profile.description = description;
    if (address) profile.address = address;
    if (city) profile.city = city;
    if (state) profile.state = state;
    if (zipCode) profile.zipCode = zipCode;
    profile.latitude = latitude;
    profile.longitude = longitude;
    if (website) profile.website = website;
    if (businessHours) profile.businessHours = businessHours;
    
    await profile.save();
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: profile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating service provider profile',
      error: error.message
    });
  }
};

// Get service provider profile
exports.getProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    const profile = await ServiceProviderProfile.findOne({
      where: { id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email', 'phoneNumber', 'profilePicture']
        },
        {
          model: Service,
          as: 'services',
          attributes: ['id', 'name', 'description', 'price', 'pricingType', 'duration', 'isActive']
        }
      ]
    });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Service provider profile not found'
      });
    }
    
    // Get reviews
    const reviews = await Review.findAll({
      where: { providerId: profile.id },
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['firstName', 'lastName', 'profilePicture']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });
    
    res.status(200).json({
      success: true,
      data: {
        ...profile.toJSON(),
        reviews
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching service provider profile',
      error: error.message
    });
  }
};

// Get my service provider profile
exports.getMyProfile = async (req, res) => {
  try {
    const profile = await ServiceProviderProfile.findOne({
      where: { userId: req.user.id },
      include: [
        {
          model: Service,
          as: 'services',
          attributes: ['id', 'name', 'description', 'price', 'pricingType', 'duration', 'isActive']
        }
      ]
    });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Service provider profile not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Get my profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your service provider profile',
      error: error.message
    });
  }
};

// Search service providers
exports.searchProviders = async (req, res) => {
  try {
    const {
      category,
      keyword,
      location,
      radius,
      minRating,
      maxPrice,
      page = 1,
      limit = 10
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {};
    const includeService = [];
    
    // Category filter
    if (category) {
      includeService.push({
        model: Service,
        as: 'services',
        required: true,
        include: [
          {
            model: ServiceCategory,
            as: 'category',
            where: { id: category }
          }
        ]
      });
    } else {
      includeService.push({
        model: Service,
        as: 'services',
        required: false
      });
    }
    
    // Keyword search
    if (keyword) {
      whereClause[Op.or] = [
        { businessName: { [Op.iLike]: `%${keyword}%` } },
        { description: { [Op.iLike]: `%${keyword}%` } }
      ];
    }
    
    // Rating filter
    if (minRating) {
      whereClause.averageRating = { [Op.gte]: minRating };
    }
    
    // Location filter with distance calculation
    let locationFilter = {};
    if (location && radius) {
      try {
        const response = await googleMapsClient.geocode({
          params: {
            address: location,
            key: process.env.GOOGLE_MAPS_API_KEY
          }
        });
        
        if (response.data.results.length > 0) {
          const targetLocation = response.data.results[0].geometry.location;
          const lat = targetLocation.lat;
          const lng = targetLocation.lng;
          
          // Haversine formula in SQL for distance calculation
          locationFilter = Sequelize.literal(
            `(
              6371 * acos(
                cos(radians(${lat})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${lng})) + 
                sin(radians(${lat})) * sin(radians(latitude))
              )
            ) <= ${radius}`
          );
        }
      } catch (error) {
        console.error('Geocoding error:', error);
      }
    }
    
    const { count, rows } = await ServiceProviderProfile.findAndCountAll({
      where: {
        ...whereClause,
        ...locationFilter
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'profilePicture']
        },
        ...includeService
      ],
      offset,
      limit: parseInt(limit),
      distinct: true,
      order: [['averageRating', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      count,
      data: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Search providers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching service providers',
      error: error.message
    });
  }
};

// Upload business documents
exports.uploadBusinessDocuments = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }
    
    const profile = await ServiceProviderProfile.findOne({
      where: { userId: req.user.id }
    });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Service provider profile not found'
      });
    }
    
    // Update profile with license document
    profile.businessLicense = req.file.location;
    await profile.save();
    
    res.status(200).json({
      success: true,
      message: 'Business document uploaded successfully',
      data: {
        businessLicense: profile.businessLicense
      }
    });
  } catch (error) {
    console.error('Upload business documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading business documents',
      error: error.message
    });
  }
};