'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('FlaggedContents', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      contentType: {
        type: Sequelize.STRING, // Changed from ENUM to STRING
        allowNull: false
      },
      contentId: {
        type: Sequelize.UUID,
        allowNull: false
      },
      contentauthorId: {
        type: Sequelize.UUID,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      contentSummary: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      flagReason: {
        type: Sequelize.STRING,
        allowNull: false
      },
      reportedbyId: {
        type: Sequelize.UUID,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      automated: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      severity: {
        type: Sequelize.STRING, // Changed from ENUM to STRING
        defaultValue: 'medium'
      },
      reportCount: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      reports: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      detectedIssues: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      status: {
        type: Sequelize.STRING, // Changed from ENUM to STRING
        defaultValue: 'pending'
      },
      moderatedbyId: {
        type: Sequelize.UUID,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      moderatedAt: {
        type: Sequelize.DATE
      },
      moderationNotes: {
        type: Sequelize.TEXT
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deletedAt: {  // Using camelCase for DB
        type: Sequelize.DATE,
        defaultValue: null
      }
    });
       
    // Add indexes
    await queryInterface.addIndex('FlaggedContents', ['contentType', 'contentId']);
    await queryInterface.addIndex('FlaggedContents', ['status']);
    await queryInterface.addIndex('FlaggedContents', ['severity']);
    await queryInterface.addIndex('FlaggedContents', ['contentauthorId']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('FlaggedContents');
  }
};