const { Service, ServiceCategory, ServiceProviderProfile } = require('../models');

// Create a service
exports.createService = async (req, res) => {
  try {
    // Get provider profile for the current user
    const providerProfile = await ServiceProviderProfile.findOne({
      where: { userId: req.user.id }
    });
    
    if (!providerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Service provider profile not found'
      });
    }
    
    const {
      name,
      description,
      price,
      pricingType,
      duration,
      ServiceCategoryId
    } = req.body;
    
    // Check if category exists
    if (ServiceCategoryId) {
      const category = await ServiceCategory.findByPk(ServiceCategoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Service category not found'
        });
      }
    }
    
    // Create service
    const service = await Service.create({
      name,
      description,
      price,
      pricingType: pricingType || 'fixed',
      duration,
      ServiceCategoryId: ServiceCategoryId,
      providerId: providerProfile.id
    });
    
    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service
    });
  } catch (error) {
    console.error('Create service error:', error);
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
    
    // Get provider profile for current user
    const providerProfile = await ServiceProviderProfile.findOne({
      where: { userId: req.user.id }
    });
    
    if (!providerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Service provider profile not found'
      });
    }
    
    // Find service
    const service = await Service.findOne({
      where: {
        id,
        providerId: providerProfile.id
      }
    });
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or not authorized'
      });
    }
    
    const {
      name,
      description,
      price,
      pricingType,
      duration,
      isActive,
      ServiceCategoryId
    } = req.body;
    
    // Check if category exists
    if (ServiceCategoryId) {
      const category = await ServiceCategory.findByPk(ServiceCategoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Service category not found'
        });
      }
      service.ServiceCategoryId = ServiceCategoryId;
    }
    
    // Update service
    if (name) service.name = name;
    if (description) service.description = description;
    if (price) service.price = price;
    if (pricingType) service.pricingType = pricingType;
    if (duration) service.duration = duration;
    if (isActive !== undefined) service.isActive = isActive;
        
    await service.save();
    
    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      data: service
    });
  } catch (error) {
    console.error('Update service error:', error);
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
    
    // Get provider profile for current user
    const providerProfile = await ServiceProviderProfile.findOne({
      where: { userId: req.user.id }
    });
    
    if (!providerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Service provider profile not found'
      });
    }
    
    // Find service
    const service = await Service.findOne({
      where: {
        id,
        providerId: providerProfile.id
      }
    });
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or not authorized'
      });
    }
    
    // Delete service
    await service.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting service',
      error: error.message
    });
  }
};

// Get all services for a provider
exports.getProviderServices = async (req, res) => {
  try {
    const { providerId } = req.params;
    
    const services = await Service.findAll({
      where: {
        providerId,
        isActive: true
      },
      include: [
        {
          model: ServiceCategory,
          as: 'category',
          attributes: ['id', 'name']
        }
      ]
    });
    
    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    console.error('Get provider services error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching services',
      error: error.message
    });
  }
};

// Get a specific service
exports.getService = async (req, res) => {
  try {
    const { id } = req.params;
    
    const service = await Service.findOne({
      where: { id },
      include: [
        {
          model: ServiceCategory,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: ServiceProviderProfile,
          as: 'provider',
          attributes: ['id', 'businessName', 'averageRating']
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
      data: service
    });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching service',
      error: error.message
    });
  }
};

// Get my services (for provider)
exports.getMyServices = async (req, res) => {
  try {
    // Get provider profile for current user
    const providerProfile = await ServiceProviderProfile.findOne({
      where: { userId: req.user.id }
    });
    
    if (!providerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Service provider profile not found'
      });
    }
    
    const services = await Service.findAll({
      where: {
        providerId: providerProfile.id
      },
      include: [
        {
          model: ServiceCategory,
          as: 'category',
          attributes: ['id', 'name']
        }
      ]
    });
    
    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    console.error('Get my services error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your services',
      error: error.message
    });
  }
};

// Get featured services
exports.getFeaturedServices = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    // Find featured services - you can define your own criteria
    const featuredServices = await Service.findAll({
      where: {
        isActive: true
        // You could add other criteria like:
        // isFeatured: true, // if you have such a field
        // or just get the newest or highest rated services
      },
      limit,
      include: [
        {
          model: ServiceCategory,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: ServiceProviderProfile,
          as: 'provider',
          attributes: ['id', 'businessName', 'averageRating']
        }
      ],
      order: [
        ['createdAt', 'DESC'] // Or sort by rating, popularity, etc.
      ]
    });
    
    res.status(200).json({
      success: true,
      count: featuredServices.length,
      data: featuredServices
    });
  } catch (error) {
    console.error('Get featured services error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured services',
      error: error.message
    });
  }
};

// Get popular categories
exports.getPopularCategories = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    
    // Get categories with the most services
    const popularCategories = await ServiceCategory.findAll({
      attributes: [
        'id',
        'name',
        'icon',
        [Service.sequelize.fn('COUNT', Service.sequelize.col('Services.id')), 'serviceCount']
      ],
      include: [
        {
          model: Service,
          as: 'Services',
          attributes: [],
          where: { isActive: true },
          required: false
        }
      ],
      group: ['ServiceCategory.id'],
      order: [
        [Service.sequelize.literal('serviceCount'), 'DESC']
      ],
      limit
    });
    
    res.status(200).json({
      success: true,
      count: popularCategories.length,
      data: popularCategories
    });
  } catch (error) {
    console.error('Get popular categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching popular categories',
      error: error.message
    });
  }
};