const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

let firebaseAdmin = null;

// Function to initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    // Check if Firebase credentials are provided in environment variables
    if (process.env.FIREBASE_CREDENTIALS) {
      const credentials = JSON.parse(process.env.FIREBASE_CREDENTIALS);

      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(credentials),
      });

      console.log('Firebase Admin SDK initialized using environment variables.');
    }
    // Or check for a service account file path in environment variables
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const serviceAccount = require(path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH));

      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      console.log('Firebase Admin SDK initialized using service account file.');
    } else {
      console.warn('Firebase credentials not found. Push notifications will not be available.');
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
  }
};

// Call the initialization function
initializeFirebase();

module.exports = firebaseAdmin;