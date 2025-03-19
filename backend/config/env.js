// config/env.js
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Define the environment paths
const envPaths = {
  development: path.resolve(process.cwd(), '.env.development'),
  test: path.resolve(process.cwd(), '.env.test'),
  staging: path.resolve(process.cwd(), '.env.staging'),
  production: path.resolve(process.cwd(), '.env.production'),
};

// Get the current environment
const NODE_ENV = process.env.NODE_ENV || 'development';

// Load the correct .env file based on environment
const envFilePath = envPaths[NODE_ENV];
const defaultEnvPath = path.resolve(process.cwd(), '.env');

// If the environment-specific file exists, load it, otherwise fall back to default .env
if (fs.existsSync(envFilePath)) {
  console.log(`Loading environment from ${envFilePath}`);
  dotenv.config({ path: envFilePath });
} else if (fs.existsSync(defaultEnvPath)) {
  console.log(`Environment-specific file not found, loading from default .env`);
  dotenv.config();
} else {
  console.log('No .env file found, using system environment variables');
}

// Define environment-specific configuration
const config = {
  // Common configuration for all environments
  common: {
    port: parseInt(process.env.PORT, 10) || 5001,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    uploadDir: process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'),
    logDir: process.env.LOG_DIR || path.join(process.cwd(), 'logs'),
    corsOrigin: process.env.CORS_ORIGIN || '*',
    logLevel: process.env.LOG_LEVEL || 'info',
    
    // Database configuration
    database: {
      url: process.env.DATABASE_URL,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      name: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    },
    
    // Third-party services configuration
    services: {
      sendgrid: {
        apiKey: process.env.SENDGRID_API_KEY
      },
      twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        phoneNumber: process.env.TWILIO_PHONE_NUMBER
      },
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY
      },
      stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
      },
      firebase: {
        credentials: process.env.FIREBASE_CREDENTIALS ? 
          JSON.parse(process.env.FIREBASE_CREDENTIALS) : null
      },
      sentry: {
        dsn: process.env.SENTRY_DSN
      }
    }
  },

  // Environment-specific configurations
  development: {
    prettyLogs: true,
    serviceTimeout: 10000, // 10 seconds
  },

  test: {
    prettyLogs: false,
    serviceTimeout: 5000, // 5 seconds
  },

  staging: {
    prettyLogs: false,
    serviceTimeout: 15000, // 15 seconds
  },

  production: {
    prettyLogs: false,
    serviceTimeout: 30000, // 30 seconds
    corsOrigin: process.env.CORS_ORIGIN || 'https://your-frontend-domain.com',
  },
};

// Merge common config with environment-specific config
const envConfig = {
  env: NODE_ENV,
  isDevelopment: NODE_ENV === 'development',
  isTest: NODE_ENV === 'test',
  isStaging: NODE_ENV === 'staging',
  isProduction: NODE_ENV === 'production',
  ...config.common,
  ...config[NODE_ENV],
};

module.exports = envConfig;