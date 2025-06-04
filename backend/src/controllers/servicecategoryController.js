// src/controllers/categoryController.js
const { ServiceCategory, Service } = require('../models');

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await ServiceCategory.findAll({
      order: [['name', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await ServiceCategory.findByPk(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
};

exports.createCategory = async (req, res) => {
  try {
    // Check admin privilege
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    const { name, description, icon } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }
    
    const category = await ServiceCategory.create({
      name,
      description,
      icon
    });
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: error.message
    });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    // Check admin privilege
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    const { id } = req.params;
    const { name, description, icon } = req.body;
    
    const category = await ServiceCategory.findByPk(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    
    await category.save();
    
    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: error.message
    });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    // Check admin privilege
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    const { id } = req.params;
    
    const category = await ServiceCategory.findByPk(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Check if category has services
    const servicesCount = await Service.count({
      where: { ServiceCategoryId: id }
    });
    
    if (servicesCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with services'
      });
    }
    
    await category.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
};

exports.getCategoryServices = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await ServiceCategory.findByPk(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    const services = await Service.findAll({
      where: { 
        ServiceCategoryId: id,
        isActive: true
      },
      include: [{
        model: ServiceProviderProfile,
        attributes: ['id', 'businessName', 'averageRating']
      }]
    });
    
    res.status(200).json({
        success: true,
        count: services.length,
        data: services
      });
    } catch (error) {
      console.error('Get category services error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching category services',
        error: error.message
      });
    }
  };