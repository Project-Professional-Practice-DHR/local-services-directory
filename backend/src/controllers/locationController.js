const User = require('../models/User');
const Service = require('../models/Service');
const mapsUtil = require('../utils/maps');

exports.updateUserLocation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({ message: 'Address is required' });
    }
    
    // Geocode the address
    const geoData = await mapsUtil.geocodeAddress(address);
    
    // Update user with location data
    const user = await User.findByIdAndUpdate(
      userId,
      {
        address: geoData.formattedAddress,
        location: {
          type: 'Point',
          coordinates: [geoData.lng, geoData.lat] // GeoJSON format: [longitude, latitude]
        }
      },
      { new: true }
    );
    
    res.status(200).json({
      message: 'Location updated successfully',
      user: {
        address: user.address,
        location: {
          lat: geoData.lat,
          lng: geoData.lng
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
      
      // Find providers within radius
      const query = {
        'location.type': 'Point',
        'location.coordinates': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude] // GeoJSON format: [longitude, latitude]
            },
            $maxDistance: radiusKm * 1000 // Convert km to meters
          }
        },
        role: 'provider',
        'accountStatus.isVerified': true
      };
      
      // Add service type filter if provided
      let providers;
      
      if (serviceType) {
        // Find services of this type first
        const services = await Service.find({ category: serviceType })
          .distinct('providerId');
        
        // Then find providers with those IDs who are also within the radius
        if (services.length > 0) {
          query._id = { $in: services };
        } else {
          // No services of this type
          return res.status(200).json({ providers: [] });
        }
      }
      
      providers = await User.find(query)
        .select('name businessName address location rating reviewCount');
      
      // Calculate exact distances for each provider
      const providersWithDistance = await Promise.all(
        providers.map(async (provider) => {
          const providerCoords = {
            lat: provider.location.coordinates[1],
            lng: provider.location.coordinates[0]
          };
          
          const userCoords = { lat: latitude, lng: longitude };
          const distance = await mapsUtil.calculateDistance(userCoords, providerCoords);
          
          return {
            _id: provider._id,
            name: provider.name,
            businessName: provider.businessName,
            address: provider.address,
            rating: provider.rating,
            reviewCount: provider.reviewCount,
            distance: {
              kilometers: distance.kilometers,
              miles: distance.miles,
              text: distance.text
            }
          };
        })
      );
      
      // Sort by distance
      providersWithDistance.sort((a, b) => a.distance.kilometers - b.distance.kilometers);
      
      res.status(200).json({ providers: providersWithDistance });
    } catch (error) {
      console.error('Error finding nearby providers:', error);
      res.status(500).json({ message: 'Failed to find nearby providers', error: error.message });
    }
  };