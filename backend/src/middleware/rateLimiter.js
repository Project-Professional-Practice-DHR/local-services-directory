const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');
const config = require('../config');

// Create Redis client if configured
let redisClient;
if (config.redis.enabled) {
  redisClient = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    tls: config.redis.tls
  });
}

// Store provider for rate limiter
const limiterStore = config.redis.enabled
  ? new RedisStore({
      redis: redisClient,
      prefix: 'rate-limit:'
    })
  : undefined; // Falls back to in-memory store

// Create different rate limiters
// Standard API limiter
exports.standardLimiter = rateLimit({
  store: limiterStore,
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many requests, please try again later.'
  },
  skip: (req) => req.path.startsWith('/api/health') // Skip health check endpoints
});

// Authentication limiter (stricter)
exports.authLimiter = rateLimit({
  store: limiterStore,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many login attempts, please try again later.'
  }
});

// Public API limiter (most restrictive)
exports.publicLimiter = rateLimit({
  store: limiterStore,
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute for public endpoints
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Rate limit exceeded, please try again later.'
  }
});

// Admin API limiter (more lenient)
exports.adminLimiter = rateLimit({
  store: limiterStore,
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute for admin endpoints
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Rate limit exceeded, please try again later.'
  }
});

// Dynamic limiter for specific IPs or users
exports.createDynamicLimiter = (windowMs, maxRequests, keyGenerator) => {
  return rateLimit({
    store: limiterStore,
    windowMs,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyGenerator || ((req) => req.ip),
    message: {
      status: 429,
      message: 'Rate limit exceeded, please try again later.'
    }
  });
};

// Graduated rate limiter based on usage pattern
exports.graduatedLimiter = async (req, res, next) => {
  if (!redisClient && config.redis.enabled) {
    return next(); // Skip if Redis isn't available
  }
  
  // Define key based on user ID if authenticated, otherwise IP
  const key = req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
  const requestsKey = `requests:${key}`;
  const blockKey = `block:${key}`;
  const warningKey = `warning:${key}`;
  
  try {
    // Check if currently blocked
    const blockTTL = await redisClient.ttl(blockKey);
    if (blockTTL > 0) {
      const blockMinutes = Math.ceil(blockTTL / 60);
      return res.status(429).json({
        status: 429,
        message: `You are temporarily blocked due to excessive requests. Please try again in ${blockMinutes} minutes.`
      });
    }
    
    // Increment request counter
    const requests = await redisClient.incr(requestsKey);
    
    // Set expiry for counter if first request
    if (requests === 1) {
      await redisClient.expire(requestsKey, 60); // 1 minute window
    }
    
    // Apply graduated response
    if (requests > 120) { // Very excessive
      // Block for 30 minutes
      await redisClient.set(blockKey, 'blocked', 'EX', 1800);
      return res.status(429).json({
        status: 429,
        message: 'You have been temporarily blocked for 30 minutes due to excessive requests.'
      });
    } else if (requests > 90) { // Highly excessive
      // Block for 5 minutes
      await redisClient.set(blockKey, 'blocked', 'EX', 300);
      return res.status(429).json({
        status: 429,
        message: 'You have been temporarily blocked for 5 minutes due to excessive requests.'
      });
    } else if (requests > 60) { // Excessive
      // Issue warning
      const warnings = await redisClient.incr(warningKey);
      if (warnings === 1) {
        await redisClient.expire(warningKey, 3600); // 1 hour for warnings
      }
      
      // After 3 warnings, block for 1 minute
      if (warnings >= 3) {
        await redisClient.set(blockKey, 'blocked', 'EX', 60);
        return res.status(429).json({
          status: 429,
          message: 'You have been temporarily blocked for 1 minute after multiple warnings.'
        });
      }
      
      res.set('X-Rate-Limit-Warning', `${warnings}/3 warnings`);
    }
    
    next();
  } catch (error) {
    console.error('Rate limiter error:', error);
    // Don't block requests if rate limiter fails
    next();
  }
};