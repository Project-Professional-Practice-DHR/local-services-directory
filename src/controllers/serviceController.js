const { Service, ServiceCategory, ServiceProviderProfile } = require('../models');

// Create a service
exports.createService = async (req, res) => {
  try {
    // Get provider profile for the current user
    const providerProfile = await ServiceProviderProfile.findOne({
      where: { UserId: req.user.id }
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
      categoryId
    } = req.body;
    
    // Check if category exists
    if (categoryId) {
      const category = await ServiceCategory.findByPk(categoryId);
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
      ServiceCategoryId: categoryId,
      ServiceProviderProfileId: providerProfile.id
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
      where: { UserId: req.user.id }
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
        ServiceProviderProfileId: providerProfile.id
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
      categoryId
    } = req.body;
    
    // Check if category exists
    if (categoryId) {
      const category = await ServiceCategory.findByPk(categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Service category not found'
        });
      }
      service.ServiceCategoryId = categoryId;
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
      where: { UserId: req.user.id }
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
        ServiceProviderProfileId: providerProfile.id
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
        ServiceProviderProfileId: providerId,
        isActive: true
      },
      include: [
        {
          model: ServiceCategory,
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
          attributes: ['id', 'name']
        },
        {
          model: ServiceProviderProfile,
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
      where: { UserId: req.user.id }
    });
    
    if (!providerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Service provider profile not found'
      });
    }
    
    const services = await Service.findAll({
      where: {
        ServiceProviderProfileId: providerProfile.id
      },
      include: [
        {
          model: ServiceCategory,
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