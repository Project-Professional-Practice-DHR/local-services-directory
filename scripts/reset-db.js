// delete-db.js
require('dotenv').config();
const { Client } = require('pg');

async function deleteDatabase() {
  // Log the DATABASE_URL (with password masked) for debugging
  const dbUrl = process.env.DATABASE_URL || '';
  const maskedUrl = dbUrl.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@');
  console.log('Using database URL:', maskedUrl);
  
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('\x1b[31m%s\x1b[0m', 'ERROR: DATABASE_URL is not set in your .env file');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for many cloud DB providers like Neon
    }
  });

  try {
    console.log('\x1b[33m%s\x1b[0m', 'WARNING: This will delete all tables and data in your database!');
    console.log('\x1b[33m%s\x1b[0m', 'Waiting 5 seconds before proceeding...');
    
    // Give a small delay to allow canceling if run by mistake
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');
    
    console.log('\x1b[31m%s\x1b[0m', 'Dropping all tables and recreating schema...');
    // This drops everything in the public schema and recreates it (empty)
    await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    
    console.log('\x1b[32m%s\x1b[0m', 'Database schema cleared successfully!');
    console.log('All tables have been deleted. The database is now empty.');
    
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Error deleting database:');
    console.error(error);
  } finally {
    await client.end();
    console.log('Database connection closed');
    process.exit(0);
  }
}

deleteDatabase();