const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../config/app.config').database.sequelize;
const User = require('./User');

class FlaggedContent extends Model {}

FlaggedContent.init(
  {
    // Content information
    content_type: {
      type: DataTypes.ENUM('review', 'service', 'user', 'message'),
      allowNull: false
    },
    content_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    content_author_id: {
      type: DataTypes.UUID,
      references: {
        model: User,
        key: 'id'
      }
    },
    content_summary: {
      type: DataTypes.TEXT,
      allowNull: false
    },

    // Flag information
    flag_reason: {
      type: DataTypes.STRING,
      allowNull: false
    },
    reported_by_id: {
      type: DataTypes.UUID,
      references: {
        model: User,
        key: 'id'
      }
    },
    automated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    severity: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium'
    },
    report_count: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    reports: {
      type: DataTypes.JSONB, // Stores an array of reports [{ reportedBy, reason, timestamp }]
      defaultValue: []
    },
    detected_issues: {
      type: DataTypes.ARRAY(DataTypes.STRING), // Stores detected issues as an array
      defaultValue: []
    },

    // Status tracking
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'removed'),
      defaultValue: 'pending'
    },
    moderated_by_id: {
      type: DataTypes.UUID,
      references: {
        model: User,
        key: 'id'
      }
    },
    moderated_at: {
      type: DataTypes.DATE
    },
    moderation_notes: {
      type: DataTypes.TEXT
    }
  },
  {
    sequelize,
    modelName: 'FlaggedContent',
    timestamps: true,
    indexes: [
      { fields: ['content_type', 'content_id'] },
      { fields: ['status'] },
      { fields: ['severity'] },
      { fields: ['content_author_id'] },
      { fields: ['created_at'] }
    ]
  }
);

// Define associations
FlaggedContent.belongsTo(User, { as: 'contentAuthor', foreignKey: 'content_author_id' });
FlaggedContent.belongsTo(User, { as: 'reportedBy', foreignKey: 'reported_by_id' });
FlaggedContent.belongsTo(User, { as: 'moderatedBy', foreignKey: 'moderated_by_id' });

module.exports = FlaggedContent;