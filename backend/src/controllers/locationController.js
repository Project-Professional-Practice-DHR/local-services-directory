const { User, Service } = require('../models');
const mapsUtil = require('../utils/maps');
const { Op } = require('sequelize');
const Sequelize = require('sequelize');

exports.updateUserLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({ message: 'Address is required' });
    }
    
    // Geocode the address
    const geoData = await mapsUtil.geocodeAddress(address);
    
    // Update user with location data
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await user.update({
      address: geoData.formattedAddress,
      latitude: geoData.lat,
      longitude: geoData.lng
    });
    
    res.status(200).json({
      message: 'Location updated successfully',
      user: {
        address: user.address,
        location: {
          lat: user.latitude,
          lng: user.longitude
        }
      }
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Failed to update location', error: error.message });
  }
};

exports.validateAddress = async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({ message: 'Address is required' });
    }
    
    // Geocode the address to validate it
    const geoData = await mapsUtil.geocodeAddress(address);
    
    res.status(200).json({
      valid: true,
      formattedAddress: geoData.formattedAddress,
      location: {
        lat: geoData.lat,
        lng: geoData.lng
      }
    });
  } catch (error) {
    console.error('Address validation error:', error);
    res.status(400).json({ 
      valid: false,
      message: 'Invalid address',
      error: error.message
    });
  }
};

exports.reverseGeocode = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }
    
    // Convert to numbers
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ message: 'Invalid coordinates' });
    }
    
    const address = await mapsUtil.reverseGeocode(latitude, longitude);
    
    res.status(200).json(address);
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    res.status(500).json({ message: 'Failed to geocode coordinates', error: error.message });
  }
};

exports.calculateDistance = async (req, res) => {
  try {
    const { origin, destination } = req.body;
    
    if (!origin || !destination) {
      return res.status(400).json({ message: 'Origin and destination are required' });
    }
    
    const distance = await mapsUtil.calculateDistance(origin, destination);
    
    res.status(200).json(distance);
  } catch (error) {
    console.error('Distance calculation error:', error);
    res.status(500).json({ message: 'Failed to calculate distance', error: error.message });
  }
};

exports.findNearbyProviders = async (req, res) => {
  try {
    const { lat, lng, radius = 10, serviceType } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ message: 'Location coordinates are required' });
    }
    
    // Convert to numbers
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);
    
    // Validate inputs
    if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusKm)) {
      return res.status(400).json({ message: 'Invalid parameters' });
    }
    
    // Calculate distance using Haversine formula (directly in SQL)
    const distanceCalculation = Sequelize.literal(`
      (
        6371 * acos(
          cos(radians(${latitude})) * 
          cos(radians(latitude)) * 
          cos(radians(longitude) - 
          radians(${longitude})) + 
          sin(radians(${latitude})) * 
          sin(radians(latitude))
        )
      )
    `);
    
    // Base query
    let query = {
      role: 'provider',
      isVerified: true,
      status: 'active'
    };
    
    // Add service type filter if provided
    if (serviceType) {
      // First find services of this type
      const services = await Service.findAll({
        where: { type: serviceType },
        attributes: ['providerId'],
        raw: true
      });
      
      if (services.length > 0) {
        const providerIds = services.map(service => service.providerId);
        query.id = { [Op.in]: providerIds };
      } else {
        // No services of this type
        return res.status(200).json({ providers: [] });
      }
    }
    
    // Find providers within radius
    const providers = await User.findAll({
      attributes: [
        'id', 
        'firstName', 
        'lastName', 
        'businessName', 
        'address', 
        'latitude', 
        'longitude',
        'rating',
        'reviewCount',
        [distanceCalculation, 'distance']
      ],
      where: query,
      having: Sequelize.literal(`distance <= ${radiusKm}`),
      order: [[Sequelize.literal('distance'), 'ASC']]
    });
    
    // Format the response
    const providersWithDistance = providers.map(provider => {
      const distance = provider.getDataValue('distance');
      return {
        id: provider.id,
        name: `${provider.firstName} ${provider.lastName}`,
        businessName: provider.businessName,
        address: provider.address,
        rating: provider.rating,
        reviewCount: provider.reviewCount,
        distance: {
          kilometers: distance,
          miles: distance * 0.621371, // Convert km to miles
          text: `${distance.toFixed(1)} km`
        }
      };
    });
    
    res.status(200).json({ providers: providersWithDistance });
  } catch (error) {
    console.error('Error finding nearby providers:', error);
    res.status(500).json({ message: 'Failed to find nearby providers', error: error.message });
  }
};