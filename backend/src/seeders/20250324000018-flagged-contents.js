'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Read the JSON data
      const data = JSON.parse(
        fs.readFileSync(
          path.join(__dirname, '../data/flagged-contents.json'),
          'utf8'
        )
      );
      
      // Process each content individually using raw SQL to handle arrays correctly
      for (const flaggedContent of data) {
        // Format detectedIssues as a PostgreSQL text array
        const detectedIssuesArray = flaggedContent.detectedIssues
          .map(issue => `'${issue}'`)
          .join(', ');
        
        // Convert reports array to JSON
        const reportsJson = JSON.stringify(flaggedContent.reports).replace(/'/g, "''");
        
        // Format dates
        const createdAt = new Date(flaggedContent.createdAt).toISOString();
        const updatedAt = new Date(flaggedContent.updatedAt).toISOString();
        const moderatedAt = flaggedContent.moderatedAt 
          ? new Date(flaggedContent.moderatedAt).toISOString() 
          : null;
        
        // Escape text fields
        const contentSummary = flaggedContent.contentSummary.replace(/'/g, "''");
        const moderationNotes = flaggedContent.moderationNotes 
          ? flaggedContent.moderationNotes.replace(/'/g, "''") 
          : null;
        
        // Use raw SQL with proper PostgreSQL array syntax for detectedIssues
        await queryInterface.sequelize.query(`
          INSERT INTO "FlaggedContents" (
            "id", "contentType", "contentId", "contentauthorId", "contentSummary",
            "flagReason", "reportedbyId", "automated", "severity", "reportCount",
            "reports", "detectedIssues", "status", "moderatedbyId", "moderatedAt",
            "moderationNotes", "createdAt", "updatedAt"
          ) VALUES (
            '${flaggedContent.id}',
            '${flaggedContent.contentType}',
            '${flaggedContent.contentId}',
            '${flaggedContent.contentauthorId}',
            '${contentSummary}',
            '${flaggedContent.flagReason}',
            ${flaggedContent.reportedbyId ? `'${flaggedContent.reportedbyId}'` : 'NULL'},
            ${flaggedContent.automated},
            '${flaggedContent.severity}',
            ${flaggedContent.reportCount},
            '${reportsJson}'::jsonb,
            ARRAY[${detectedIssuesArray}],
            '${flaggedContent.status}',
            ${flaggedContent.moderatedbyId ? `'${flaggedContent.moderatedbyId}'` : 'NULL'},
            ${moderatedAt ? `'${moderatedAt}'` : 'NULL'},
            ${moderationNotes ? `'${moderationNotes}'` : 'NULL'},
            '${createdAt}',
            '${updatedAt}'
          )
        `);
      }
      
      console.log('FlaggedContents seeded successfully');
    } catch (error) {
      console.error('Error seeding FlaggedContents:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('FlaggedContents', null, {});
  }
};