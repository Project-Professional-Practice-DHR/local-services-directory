// src/controllers/portfolioController.js
const { PortfolioItem, ServiceProviderProfile } = require('../models');
const { uploadToS3 } = require('../utils/fileUpload');

exports.addPortfolioItem = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required'
      });
    }
    
    const { description } = req.body;
    
    // Get provider profile
    const providerProfile = await ServiceProviderProfile.findOne({
      where: { userId: req.user.id }
    });
    
    if (!providerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Service provider profile not found'
      });
    }
    
    // Upload image to S3
    const imageUrl = await uploadToS3(req.file, `portfolio/${providerProfile.id}`);
    
    // Create portfolio item
    const portfolioItem = await PortfolioItem.create({
      providerId: providerProfile.id,
      imageUrl,
      description
    });
    
    res.status(201).json({
      success: true,
      message: 'Portfolio item added successfully',
      data: portfolioItem
    });
  } catch (error) {
    console.error('Add portfolio item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding portfolio item',
      error: error.message
    });
  }
};

exports.getProviderPortfolio = async (req, res) => {
  try {
    const { providerId } = req.params;
    
    const portfolioItems = await PortfolioItem.findAll({
      where: { providerId },
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      data: portfolioItems
    });
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching portfolio',
      error: error.message
    });
  }
};

exports.deletePortfolioItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get provider profile
    const providerProfile = await ServiceProviderProfile.findOne({
      where: { userId: req.user.id }
    });
    
    if (!providerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Service provider profile not found'
      });
    }
    
    // Find portfolio item
    const portfolioItem = await PortfolioItem.findOne({
      where: { 
        id,
        providerId: providerProfile.id
      }
    });
    
    if (!portfolioItem) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio item not found or not authorized'
      });
    }
    
    // Delete from S3 (optional, depending on your storage policy)
    // await deleteFromS3(portfolioItem.imageUrl);
    
    // Delete from database
    await portfolioItem.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Portfolio item deleted successfully'
    });
  } catch (error) {
    console.error('Delete portfolio item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting portfolio item',
      error: error.message
    });
  }
};

exports.updatePortfolioItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;
    
    // Get provider profile
    const providerProfile = await ServiceProviderProfile.findOne({
      where: { userId: req.user.id }
    });
    
    if (!providerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Service provider profile not found'
      });
    }
    
    // Find portfolio item
    const portfolioItem = await PortfolioItem.findOne({
      where: { 
        id,
        providerId: providerProfile.id
      }
    });
    
    if (!portfolioItem) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio item not found or not authorized'
      });
    }
    
    // Update image if provided
    if (req.file) {
      // Upload new image to S3
      const imageUrl = await uploadToS3(req.file, `portfolio/${providerProfile.id}`);
      
      // Delete old image from S3 (optional)
      // await deleteFromS3(portfolioItem.imageUrl);
      
      portfolioItem.imageUrl = imageUrl;
    }
    
    // Update description if provided
    if (description !== undefined) {
      portfolioItem.description = description;
    }
    
    await portfolioItem.save();
    
    res.status(200).json({
      success: true,
      message: 'Portfolio item updated successfully',
      data: portfolioItem
    });
  } catch (error) {
    console.error('Update portfolio item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating portfolio item',
      error: error.message
    });
  }
};