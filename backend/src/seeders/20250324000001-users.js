'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Read the JSON data
      const data = JSON.parse(
        fs.readFileSync(
          path.join(__dirname, '../data/users.json'),
          'utf8'
        )
      );
      
      // Process data before insertion
      const processedData = data.map(user => {
        const processedUser = {...user};
        
        // Process deviceTokens
        if (typeof processedUser.deviceTokens === 'string') {
          try {
            // Parse the string representation of array
            const parsedTokens = JSON.parse(processedUser.deviceTokens);
            processedUser.deviceTokens = parsedTokens.length > 0 ? parsedTokens : [''];
          } catch (e) {
            // If parsing fails, set to array with empty string
            processedUser.deviceTokens = [''];
          }
        }
        
        // Process devices
        if (typeof processedUser.devices === 'string') {
          try {
            // Parse the string representation of array of objects
            const parsedDevices = JSON.parse(processedUser.devices);
            processedUser.devices = parsedDevices.length > 0 
              ? parsedDevices.map(device => ({
                  deviceId: device.deviceId || '',
                  deviceType: device.deviceType || '',
                  lastLogin: device.lastLogin ? new Date(device.lastLogin).toISOString() : ''
                }))
              : [{ deviceId: '', deviceType: '', lastLogin: '' }];
          } catch (e) {
            // If parsing fails, set to array with empty object
            processedUser.devices = [{ deviceId: '', deviceType: '', lastLogin: '' }];
          }
        }
        
        // Ensure dates are proper Date objects or ISO strings
        ['createdAt', 'updatedAt', 'lastLogin', 'resetPasswordExpires'].forEach(dateField => {
          if (processedUser[dateField]) {
            try {
              processedUser[dateField] = new Date(processedUser[dateField]).toISOString();
            } catch (e) {
              processedUser[dateField] = null;
            }
          }
        });
        
        // Ensure role is valid
        const validRoles = ['customer', 'provider', 'admin'];
        if (!validRoles.includes(processedUser.role)) {
          processedUser.role = 'customer';
        }
        
        // Ensure status is valid
        const validStatuses = ['active', 'inactive', 'suspended'];
        if (!validStatuses.includes(processedUser.status)) {
          processedUser.status = 'active';
        }
        
        // Ensure boolean fields
        processedUser.isVerified = !!processedUser.isVerified;
        
        return processedUser;
      });
      
      // Insert processed data
      for (const user of processedData) {
        await queryInterface.sequelize.query(
          `INSERT INTO "Users" (
            "id", "username", "firstName", "lastName", "email", 
            "phoneNumber", "password", "role", "profilePicture", 
            "isVerified", "status", "deviceTokens", "devices", 
            "createdAt", "updatedAt"
          ) VALUES (
            :id, :username, :firstName, :lastName, :email, 
            :phoneNumber, :password, :role, :profilePicture, 
            :isVerified, :status, 
            ARRAY[${user.deviceTokens.map(t => `'${t}'`).join(',')}]::text[], 
            ARRAY[${user.devices.map(d => `'${JSON.stringify(d)}'`).join(',')}]::jsonb[], 
            :createdAt, :updatedAt
          )`,
          {
            replacements: user,
            type: queryInterface.sequelize.QueryTypes.INSERT
          }
        );
        console.log(`User ${user.username} seeded successfully`);
      }
      
      console.log('All users seeded successfully');
    } catch (error) {
      console.error('Error seeding Users:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  }
};