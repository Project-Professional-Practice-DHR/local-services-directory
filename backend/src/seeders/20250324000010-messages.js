'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Read the JSON data
      const data = JSON.parse(
        fs.readFileSync(
          path.join(__dirname, '../data/messages.json'),
          'utf8'
        )
      );
      
      // Process the data to handle json[] type correctly
      for (const message of data) {
        // PostgreSQL expects json[] to be an array of individual JSON strings
        // So we need to handle each attachment as a separate JSON entry in the array
        let attachmentsArray = "'{}'"; // Default empty array in PostgreSQL text representation
        
        if (message.attachments && message.attachments.length > 0) {
          // Format each attachment as a JSON string, then join them in PostgreSQL array syntax
          attachmentsArray = "ARRAY[" + 
            message.attachments.map(attachment => 
              `'${JSON.stringify(attachment)}'::json`
            ).join(', ') + 
          "]";
        } else {
          // For empty arrays, use an empty array
          attachmentsArray = "ARRAY[]::json[]";
        }
        
        // Use direct SQL with the properly formatted attachments array
        await queryInterface.sequelize.query(`
          INSERT INTO "Messages" (
            "id", "senderId", "receiverId", "content", "bookingId", 
            "isRead", "readAt", "attachments", "createdAt", "updatedAt"
          ) VALUES (
            '${message.id}', 
            '${message.senderId}', 
            '${message.receiverId}', 
            '${message.content.replace(/'/g, "''")}', 
            '${message.bookingId}', 
            ${message.isRead}, 
            ${message.readAt ? `'${message.readAt}'` : 'NULL'}, 
            ${attachmentsArray}, 
            '${message.createdAt}', 
            '${message.updatedAt}'
          )
        `);
      }
      
      console.log('Messages seeded successfully');
    } catch (error) {
      console.error('Error seeding Messages:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Messages', null, {});
  }
};