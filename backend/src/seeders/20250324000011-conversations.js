'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Read the JSON data
      const data = JSON.parse(
        fs.readFileSync(
          path.join(__dirname, '../data/conversations.json'),
          'utf8'
        )
      );
      
      // Process each conversation individually using raw SQL
      for (const conversation of data) {
        // Format participants as a PostgreSQL UUID array with proper casting
        const participantsArray = conversation.participants
          .map(id => `'${id}'::uuid`)
          .join(', ');
        
        // Format lastMessage and unreadCount as JSON
        const lastMessageJson = JSON.stringify(conversation.lastMessage).replace(/'/g, "''");
        const unreadCountJson = JSON.stringify(conversation.unreadCount).replace(/'/g, "''");
        
        // Create formatted dates
        const createdAt = new Date(conversation.createdAt).toISOString();
        const updatedAt = new Date(conversation.updatedAt).toISOString();
        
        // Use raw SQL with proper PostgreSQL array syntax and explicit casting to UUID[]
        await queryInterface.sequelize.query(`
          INSERT INTO "Conversations" (
            "id", "participants", "lastMessage", "unreadCount", 
            "bookingId", "createdAt", "updatedAt"
          ) VALUES (
            '${conversation.id}', 
            ARRAY[${participantsArray}], 
            '${lastMessageJson}'::jsonb, 
            '${unreadCountJson}'::jsonb, 
            '${conversation.bookingId}', 
            '${createdAt}', 
            '${updatedAt}'
          )
        `);
      }
      
      console.log('Conversations seeded successfully');
    } catch (error) {
      console.error('Error seeding Conversations:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Conversations', null, {});
  }
};