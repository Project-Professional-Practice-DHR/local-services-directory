// config/app.config.js
const { sequelize } = require('../config/database'); // Import sequelize from database.js

module.exports = {
  app: {
    name: 'Service Marketplace API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5001,
    apiPrefix: '/api/v1',
    baseUrl: process.env.BASE_URL || 'http://localhost:5001',
    trustProxy: parseInt(process.env.TRUST_PROXY) || 0
  },

  jwt: {
    secret: process.env.JWT_SECRET || '+j0ScxpnDC/WLrVrInRzOxEl0IasBc1cb1viWli0QLA=',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },

  // Sequelize database configuration (importing from database.js)
  database: {
    sequelize,  // Use the sequelize instance from database.js
    
    // Add the missing functions
    testConnection: async function() {
      try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
        return true;
      } catch (error) {
        console.error('Unable to connect to the database:', error);
        throw error;
      }
    },
    
    syncDatabase: async function() {
      try {
        await sequelize.sync({ alter: process.env.DB_ALTER === 'true' });
        console.log('Database synchronized successfully');
        return true;
      } catch (error) {
        console.error('Error synchronizing database:', error);
        throw error;
      }
    }
  },

  email: {
    from: process.env.EMAIL_FROM || 'noreply@servicemarketplace.com',
    provider: process.env.EMAIL_PROVIDER || 'sendgrid',
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY
    }
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    platformFeePercent: parseFloat(process.env.PLATFORM_FEE_PERCENT) || 10
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: process.env.LOG_ENABLE_CONSOLE !== 'false',
    enableFile: process.env.LOG_ENABLE_FILE === 'true',
    filePath: process.env.LOG_FILE_PATH || './logs/app.log'
  },

  rateLimiting: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later'
  },

  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10,
    cors: {
      allowedOrigins: (process.env.CORS_ALLOWED_ORIGINS || '*').split(','),
      allowedMethods: (process.env.CORS_ALLOWED_METHODS || 'GET,HEAD,PUT,PATCH,POST,DELETE').split(','),
      allowedHeaders: (process.env.CORS_ALLOWED_HEADERS || 'Content-Type,Authorization').split(','),
      exposedHeaders: (process.env.CORS_EXPOSED_HEADERS || '').split(','),
      credentials: process.env.CORS_CREDENTIALS === 'true',
      maxAge: parseInt(process.env.CORS_MAX_AGE) || 86400 // 24 hours
    }
  },

  maps: {
    provider: process.env.MAPS_PROVIDER || 'google',
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    defaultSearchRadius: parseInt(process.env.DEFAULT_SEARCH_RADIUS) || 10 // in kilometers
  },

  uploads: {
    storage: process.env.UPLOAD_STORAGE || 'local', // 'local', 's3', etc.
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png,image/gif,application/pdf').split(','),
    local: {
      uploadDir: process.env.UPLOAD_DIR || './uploads'
    },
    s3: {
      bucket: process.env.S3_BUCKET,
      region: process.env.S3_REGION || 'us-east-1',
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
    }
  },

  notifications: {
    provider: process.env.NOTIFICATION_PROVIDER || 'firebase',
    firebase: {
      serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT,
      databaseURL: process.env.FIREBASE_DATABASE_URL
    }
  },

  moderation: {
    automaticFiltering: process.env.AUTOMATIC_FILTERING === 'true',
    moderationApiKey: process.env.MODERATION_API_KEY,
    contentFilterLevel: process.env.CONTENT_FILTER_LEVEL || 'medium' // 'low', 'medium', 'high'
  }
};