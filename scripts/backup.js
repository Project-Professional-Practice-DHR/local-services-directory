// scripts/backup.js
const fs = require('fs');
const path = require('path');
const util = require('util');
const fetch = require('node-fetch');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Configuration
const config = {
  // Database connection from environment variables
  databaseUrl: process.env.DATABASE_URL,
  
  // Backup directory - defaults to "backups" folder in project root
  backupDir: process.env.BACKUP_DIR || path.join(__dirname, '..', 'backups'),
  
  // Retention period in days (how long to keep backups)
  retentionDays: process.env.BACKUP_RETENTION_DAYS || 7,
  
  // Format string for log filename
  filenameFormat: 'backup_log_%s.json',
  
  // Neon.tech API configuration
  neon: {
    apiKey: process.env.NEON_API_KEY,
    projectId: process.env.NEON_PROJECT_ID,
  }
};

// Ensure backup directory exists
const ensureBackupDir = () => {
  if (!fs.existsSync(config.backupDir)) {
    fs.mkdirSync(config.backupDir, { recursive: true });
    console.log(`Created backup directory: ${config.backupDir}`);
  }
};

// Create a timestamp string for filenames: YYYY-MM-DD_HH-MM-SS
const getTimestamp = () => {
  const now = new Date();
  return now.toISOString()
    .replace(/T/, '_')
    .replace(/\..+/, '')
    .replace(/:/g, '-');
};

// Create database backup using Neon.tech API
const createNeonBackup = async () => {
  if (!config.neon.apiKey || !config.neon.projectId) {
    console.log('Neon API key or project ID not configured. Please check your environment variables.');
    return null;
  }
  
  try {
    // API endpoint for creating a backup
    const apiUrl = `https://console.neon.tech/api/v2/projects/${config.neon.projectId}/branches/br-abc123/backups`;
    
    console.log(`Creating Neon.tech backup via API: ${config.neon.projectId}`);
    
    // Make API request to create backup
    const response = await fetch(`https://console.neon.tech/api/v2/projects/${config.neon.projectId}/branches/main/backups`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.neon.apiKey}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Neon API error (${response.status}): ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`Neon.tech backup created successfully. Backup ID: ${result.id}`);
    
    // Save backup info to backup log
    const backupLog = {
      timestamp: new Date().toISOString(),
      type: 'neon_api',
      backupId: result.id,
      projectId: config.neon.projectId,
      status: 'success',
      details: result
    };
    
    // Save backup log to file
    const timestamp = getTimestamp();
    const logFilename = util.format(config.filenameFormat, timestamp);
    const logFilePath = path.join(config.backupDir, logFilename);
    
    fs.writeFileSync(logFilePath, JSON.stringify(backupLog, null, 2));
    console.log(`Backup log saved to: ${logFilePath}`);
    
    return result;
  } catch (error) {
    console.error('Neon backup failed:', error.message);
    return null;
  }
};

// Clean old backup logs based on retention policy
const cleanOldBackups = async () => {
  const files = fs.readdirSync(config.backupDir);
  const now = new Date();
  let cleanedCount = 0;
  
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    
    const filePath = path.join(config.backupDir, file);
    const fileStat = fs.statSync(filePath);
    
    // Calculate file age in days
    const fileAge = (now - fileStat.mtime) / (1000 * 60 * 60 * 24);
    
    // Delete files older than retention period
    if (fileAge > config.retentionDays) {
      fs.unlinkSync(filePath);
      console.log(`Deleted old backup log: ${file} (${fileAge.toFixed(1)} days old)`);
      cleanedCount++;
    }
  }
  
  return cleanedCount;
};

// List available backup logs
const listBackups = () => {
  try {
    ensureBackupDir();
    const files = fs.readdirSync(config.backupDir)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(config.backupDir, file);
        const stats = fs.statSync(filePath);
        
        // Read the backup log
        const backupLog = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        return {
          filename: file,
          path: filePath,
          timestamp: backupLog.timestamp,
          type: backupLog.type,
          backupId: backupLog.backupId,
          status: backupLog.status
        };
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by date, newest first
      
    return files;
  } catch (error) {
    console.error('Error listing backups:', error.message);
    return [];
  }
};

// Main function to run backup
const runBackup = async () => {
  try {
    const startTime = Date.now();
    console.log('=== Database Backup Started ===');
    console.log(`Time: ${new Date().toISOString()}`);
    console.log(`Retention period: ${config.retentionDays} days`);
    
    // Ensure backup directory exists
    ensureBackupDir();
    
    // Create backup using Neon API
    const neonBackupResult = await createNeonBackup();
    
    // Clean old backups
    const cleanedCount = await cleanOldBackups();
    console.log(`Cleaned ${cleanedCount} old backup logs`);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`=== Database Backup Completed ===`);
    console.log(`Duration: ${duration} seconds`);
    
    return { 
      success: true, 
      neonBackup: neonBackupResult,
      duration,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Backup process failed:', error.message);
    return { success: false, error: error.message };
  }
};

// If the script is run directly
if (require.main === module) {
  runBackup()
    .then(result => {
      if (result.success) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Unexpected error:', err);
      process.exit(1);
    });
}

module.exports = {
  runBackup,
  listBackups
};