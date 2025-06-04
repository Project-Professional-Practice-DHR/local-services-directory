'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // User can have one ServiceProviderProfile
      User.hasOne(models.ServiceProviderProfile, {
        foreignKey: 'userId',  // Keep camelCase
        as: 'providerProfile'
      });

      // User can have many bookings as a customer
      User.hasMany(models.Booking, {
        foreignKey: 'customerId',  // Keep camelCase
        as: 'bookingsAsCustomer'
      });

      // User can have many reviews that they wrote
      User.hasMany(models.Review, {
        foreignKey: 'customerId',  // Keep camelCase
        as: 'reviewsWritten'
      });

      // User can send many messages
      User.hasMany(models.Message, {
        foreignKey: 'senderId',  // Keep camelCase
        as: 'messagesSent'
      });

      // User can receive many messages
      User.hasMany(models.Message, {
        foreignKey: 'receiverId',  // Keep camelCase
        as: 'messagesReceived'
      });

      // User can have many notifications
      User.hasMany(models.Notification, {
        foreignKey: 'userId',  // Keep camelCase
        as: 'notifications'
      });

      // User can have many device tokens
      User.hasMany(models.DeviceToken, {
        foreignKey: 'userId',  // Keep camelCase
        as: 'userdeviceTokens'
      });
    }

    // Instance method to compare passwords
    async comparePassword(candidatePassword) {
      return await bcrypt.compare(candidatePassword, this.password);
    }
  }
  
  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false
    },
    firstName: {  // Keep camelCase
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {  // Keep camelCase
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    phoneNumber: {  // Keep camelCase
      type: DataTypes.STRING,
      validate: {
        is: /^\+?[1-9]\d{1,14}$/  // Validate phone number format (International)
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('customer', 'provider', 'admin'),
      defaultValue: 'customer'
    },
    profilePicture: {  // Keep camelCase
      type: DataTypes.STRING,
    },
    isVerified: {  // Keep camelCase
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    verificationToken: {  // Keep camelCase
      type: DataTypes.STRING,
    },
    resetPasswordToken: {  // Keep camelCase
      type: DataTypes.STRING,
    },
    resetPasswordExpires: {  // Keep camelCase
      type: DataTypes.DATE,
    },
    lastLogin: {  // Keep camelCase
      type: DataTypes.DATE,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    },
    // Add geospatial location field
    location: {
      type: DataTypes.GEOMETRY('POINT'),
      allowNull: true
    },
    // Add deviceTokens and devices fields
    deviceTokens: {  // Keep camelCase
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    devices: {
      type: DataTypes.ARRAY(DataTypes.JSONB),  // Store device details as JSON
      defaultValue: []
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users',  // Explicitly set table name
    freezeTableName: true, // Don't pluralize table name
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    },
    
  });
  
  return User;
};