const axios = require('axios');
const NodeCache = require('node-cache');

// Cache for storing geocoding results (TTL: 1 day)
const geocodeCache = new NodeCache({ stdTTL: 86400 });

// Google Maps API key from environment variables
const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Rate limiter configuration
const RATE_LIMIT = {
  requests: 0,
  lastReset: Date.now(),
  maxRequests: 500, // Adjust based on your Google Maps API plan
  resetInterval: 60 * 60 * 1000 // 1 hour
};

// Check and reset rate limiter
const checkRateLimit = () => {
  const now = Date.now();
  if (now - RATE_LIMIT.lastReset > RATE_LIMIT.resetInterval) {
    RATE_LIMIT.requests = 0;
    RATE_LIMIT.lastReset = now;
    return true;
  }
  
  return RATE_LIMIT.requests < RATE_LIMIT.maxRequests;
};

// Increment rate limiter
const incrementRateLimit = () => {
  RATE_LIMIT.requests += 1;
};

// Geocode an address to get coordinates
exports.geocodeAddress = async (address) => {
  try {
    // Check cache first
    const cacheKey = `geocode:${address}`;
    const cachedResult = geocodeCache.get(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }
    
    // Check rate limit
    if (!checkRateLimit()) {
      throw new Error('Google Maps API rate limit exceeded. Please try again later.');
    }
    
    // Make API request
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address,
        key: API_KEY
      }
    });
    
    incrementRateLimit();
    
    // Handle API response
    if (response.data.status !== 'OK') {
      throw new Error(`Geocoding error: ${response.data.status}`);
    }
    
    const result = response.data.results[0];
    const coordinates = {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formattedAddress: result.formatted_address
    };
    
    // Cache the result
    geocodeCache.set(cacheKey, coordinates);
    
    return coordinates;
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
};

// Reverse geocode coordinates to get address
exports.reverseGeocode = async (lat, lng) => {
  try {
    // Check cache first
    const cacheKey = `reverse:${lat},${lng}`;
    const cachedResult = geocodeCache.get(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }
    
    // Check rate limit
    if (!checkRateLimit()) {
      throw new Error('Google Maps API rate limit exceeded. Please try again later.');
    }
    
    // Make API request
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        latlng: `${lat},${lng}`,
        key: API_KEY
      }
    });
    
    incrementRateLimit();
    
    // Handle API response
    if (response.data.status !== 'OK') {
      throw new Error(`Reverse geocoding error: ${response.data.status}`);
    }
    
    const result = response.data.results[0];
    const address = {
      formattedAddress: result.formatted_address,
      components: result.address_components
    };
    
    // Cache the result
    geocodeCache.set(cacheKey, address);
    
    return address;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw error;
  }
};

// Calculate distance between two coordinates
exports.calculateDistance = async (origin, destination) => {
  try {
    // Check cache first
    const cacheKey = `distance:${JSON.stringify(origin)}-${JSON.stringify(destination)}`;
    const cachedResult = geocodeCache.get(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }
    
    // Check rate limit
    if (!checkRateLimit()) {
      throw new Error('Google Maps API rate limit exceeded. Please try again later.');
    }
    
    // Prepare coordinates for API
    const originStr = typeof origin === 'string' 
      ? origin 
      : `${origin.lat},${origin.lng}`;
    
    const destinationStr = typeof destination === 'string'
      ? destination
      : `${destination.lat},${destination.lng}`;
    
    // Make API request
    const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: originStr,
        destinations: destinationStr,key: API_KEY,
        units: 'metric'
      }
    });
    
    incrementRateLimit();
    
    // Handle API response
    if (response.data.status !== 'OK') {
      throw new Error(`Distance Matrix error: ${response.data.status}`);
    }
    
    const result = response.data.rows[0].elements[0];
    
    if (result.status !== 'OK') {
      throw new Error(`Distance calculation error: ${result.status}`);
    }
    
    const distance = {
      meters: result.distance.value,
      kilometers: result.distance.value / 1000,
      miles: (result.distance.value / 1000) * 0.621371,
      text: result.distance.text,
      duration: {
        seconds: result.duration.value,
        text: result.duration.text
      }
    };
    
    // Cache the result
    geocodeCache.set(cacheKey, distance);
    
    return distance;
  } catch (error) {
    console.error('Distance calculation error:', error);
    throw error;
  }
};