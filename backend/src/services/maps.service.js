const axios = require('axios');
const { ServiceProvider } = require('../models');
const ServiceCategory = require('../models/ServiceCategory');

// Geocode an address to get coordinates
const geocodeAddress = async (address) => {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address,
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });
    
    if (response.data.status !== 'OK') {
      throw new Error(`Geocoding failed: ${response.data.status}`);
    }
    
    const { results } = response.data;
    
    if (results.length === 0) {
      throw new Error('No results found for the address');
    }
    
    const { lat, lng } = results[0].geometry.location;
    const formattedAddress = results[0].formatted_address;
    
    return {
      latitude: lat,
      longitude: lng,
      formattedAddress,
      components: results[0].address_components
    };
  } catch (error) {
    console.error('Geocoding failed:', error);
    throw error;
  }
};

// Calculate distance between two points
const calculateDistance = async (origin, destination) => {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`,
        destinations: typeof destination === 'string' ? destination : `${destination.lat},${destination.lng}`,
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });
    
    if (response.data.status !== 'OK') {
      throw new Error(`Distance calculation failed: ${response.data.status}`);
    }
    
    const { rows } = response.data;
    
    if (rows.length === 0 || rows[0].elements.length === 0) {
      throw new Error('No route found between the points');
    }
    
    const { distance, duration } = rows[0].elements[0];
    
    return {
      distanceText: distance.text,
      distanceValue: distance.value, // in meters
      durationText: duration.text,
      durationValue: duration.value // in seconds
    };
  } catch (error) {
    console.error('Distance calculation failed:', error);
    throw error;
  }
};

// Find providers within a certain radius
const findProvidersNearby = async (latitude, longitude, radiusInKm = 10, serviceCategoryId = null) => {
  try {
    // Convert radius to meters
    const radiusInMeters = radiusInKm * 1000;
    
    // PostgreSQL query using Earth distance calculation
    const providers = await ServiceProvider.findAll({
      attributes: [
        'id', 'userId', 'businessName', 'businessDescription', 'latitude', 'longitude',
        [
          // Haversine formula to calculate distance
          sequelize.literal(`
            6371 * acos(
              cos(radians(${latitude})) * 
              cos(radians(latitude)) * 
              cos(radians(longitude) - radians(${longitude})) + 
              sin(radians(${latitude})) * 
              sin(radians(latitude))
            )
          `), 
          'distance'
        ]
      ],
      where: sequelize.literal(`
        6371 * acos(
          cos(radians(${latitude})) * 
          cos(radians(latitude)) * 
          cos(radians(longitude) - radians(${longitude})) + 
          sin(radians(${latitude})) * 
          sin(radians(latitude))
        ) < ${radiusInKm}
      `),
      include: [
        {
          model: Service,
          required: serviceCategoryId ? true : false,
          include: [
            {
              model: ServiceCategory,
              where: serviceCategoryId ? { id: serviceCategoryId } : {}
            }
          ]
        }
      ],
      order: [[sequelize.literal('distance'), 'ASC']]
    });
    
    return providers;
  } catch (error) {
    console.error('Provider search failed:', error);
    throw error;
  }
};

// Get place details from Google Places API
const getPlaceDetails = async (placeId) => {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      params: {
        place_id: placeId,
        fields: 'name,formatted_address,geometry,photos,place_id,rating,opening_hours,website,formatted_phone_number',
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });
    
    if (response.data.status !== 'OK') {
      throw new Error(`Place details failed: ${response.data.status}`);
    }
    
    return response.data.result;
  } catch (error) {
    console.error('Place details failed:', error);
    throw error;
  }
};

module.exports = {
  geocodeAddress,
  calculateDistance,
  findProvidersNearby,
  getPlaceDetails
};