/**
 * Neon.tech Database Backup Script
 * 
 * This script creates and manages backups for Neon.tech PostgreSQL database.
 * It uses the Neon API to create branch backups and manage retention.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const NEON_API_KEY = process.env.NEON_API_KEY;
const NEON_PROJECT_ID = process.env.NEON_PROJECT_ID;
const RETENTION_DAYS = 14; // Keep backups for 14 days
const BACKUP_LOG_FILE = path.join(__dirname, '../logs/neon-backups.json');

if (!NEON_API_KEY || !NEON_PROJECT_ID) {
  console.error('Error: NEON_API_KEY and NEON_PROJECT_ID environment variables are required');
  process.exit(1);
}

// Setup axios with Neon API base URL
const neonApi = axios.create({
  baseURL: 'https://console.neon.tech/api/v2',
  headers: {
    'Authorization': `Bearer ${NEON_API_KEY}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Function to create a backup (by creating a branch)
async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `backup-${timestamp}`;
  
  try {
    console.log(`Creating backup branch: ${backupName}`);
    
    // Create a new branch from the main branch
    const response = await neonApi.post(`/projects/${NEON_PROJECT_ID}/branches`, {
      branch: {
        name: backupName,
        parent_id: 'main',  // Assuming 'main' is your primary branch
      },
    });
    
    if (response.status === 201) {
      const backupData = {
        id: response.data.branch.id,
        name: backupName,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      };
      
      // Log backup info
      saveBackupLog(backupData);
      
      console.log(`Backup created successfully with ID: ${backupData.id}`);
      return backupData;
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error creating backup:', error.response?.data || error.message);
    throw error;
  }
}

// Function to delete a backup branch
async function deleteBackup(branchId) {
  try {
    console.log(`Deleting backup branch with ID: ${branchId}`);
    
    const response = await neonApi.delete(`/projects/${NEON_PROJECT_ID}/branches/${branchId}`);
    
    if (response.status === 200) {
      console.log(`Backup branch deleted successfully: ${branchId}`);
      return true;
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting backup:', error.response?.data || error.message);
    return false;
  }
}

// Function to clean up expired backups
async function cleanupExpiredBackups() {
  try {
    const backups = loadBackupLog();
    const now = new Date();
    const expiredBackups = backups.filter(backup => new Date(backup.expires_at) < now);
    
    console.log(`Found ${expiredBackups.length} expired backups to clean up`);
    
    for (const backup of expiredBackups) {
      const deleted = await deleteBackup(backup.id);
      if (deleted) {
        // Remove from log if successfully deleted
        const updatedBackups = backups.filter(b => b.id !== backup.id);
        fs.writeFileSync(BACKUP_LOG_FILE, JSON.stringify(updatedBackups, null, 2));
      }
    }
  } catch (error) {
    console.error('Error cleaning up expired backups:', error);
  }
}

// Function to load backup log
function loadBackupLog() {
  try {
    if (fs.existsSync(BACKUP_LOG_FILE)) {
      const data = fs.readFileSync(BACKUP_LOG_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading backup log:', error);
    return [];
  }
}

// Function to save backup log
function saveBackupLog(backupData) {
  try {
    const backups = loadBackupLog();
    backups.push(backupData);
    
    // Ensure the logs directory exists
    const logsDir = path.dirname(BACKUP_LOG_FILE);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    fs.writeFileSync(BACKUP_LOG_FILE, JSON.stringify(backups, null, 2));
  } catch (error) {
    console.error('Error saving backup log:', error);
  }
}

// Main function to run the backup process
async function main() {
  try {
    console.log('Starting Neon.tech database backup process');
    
    // First clean up any expired backups
    await cleanupExpiredBackups();
    
    // Create a new backup
    await createBackup();
    
    console.log('Backup process completed successfully');
  } catch (error) {
    console.error('Backup process failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  createBackup,
  deleteBackup,
  cleanupExpiredBackups,
};