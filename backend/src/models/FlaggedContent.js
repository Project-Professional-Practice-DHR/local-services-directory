'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FlaggedContent extends Model {
    static associate(models) {
      FlaggedContent.belongsTo(models.User, {
        as: 'contentAuthor',
        foreignKey: 'contentauthorId'
      });
      
      FlaggedContent.belongsTo(models.User, {
        as: 'reportedBy',
        foreignKey: 'reportedbyId'
      });
      
      FlaggedContent.belongsTo(models.User, {
        as: 'moderatedBy',
        foreignKey: 'moderatedbyId'
      });
    }
  }
  
  FlaggedContent.init({
    contentType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    contentId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    contentauthorId: {
      type: DataTypes.UUID
    },
    contentSummary: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    flagReason: {
      type: DataTypes.STRING,
      allowNull: false
    },
    reportedbyId: {
      type: DataTypes.UUID
    },
    automated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    severity: {
      type: DataTypes.STRING,
      defaultValue: 'medium'
    },
    reportCount: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    reports: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    detectedIssues: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending'
    },
    moderatedbyId: {
      type: DataTypes.UUID
    },
    moderatedAt: {
      type: DataTypes.DATE
    },
    moderationNotes: {
      type: DataTypes.TEXT
    }
  }, {
    sequelize,
    modelName: 'FlaggedContent',
    tableName: 'FlaggedContents',
    underscored: false,
    freezeTableName: true,
    timestamps: true
  });
  
  return FlaggedContent;
};