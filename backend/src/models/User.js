'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // User can have one ServiceProviderProfile
      User.hasOne(models.ServiceProviderProfile, {
        foreignKey: 'userId',
        as: 'providerProfile'
      });

      // Bookings as a customer
      User.hasMany(models.Booking, {
        foreignKey: 'userId',
        as: 'bookingsAsCustomer'
      });

      // Reviews written by the user
      User.hasMany(models.Review, {
        foreignKey: 'userId',
        as: 'reviewsWritten'
      });

      // Messages sent
      User.hasMany(models.Message, {
        foreignKey: 'senderId',
        as: 'messagesSent'
      });

      // Messages received
      User.hasMany(models.Message, {
        foreignKey: 'receiverId',
        as: 'messagesReceived'
      });

      // Notifications
      User.hasMany(models.Notification, {
        foreignKey: 'userId',
        as: 'notifications'
      });

      // Device tokens
      User.hasMany(models.DeviceToken, {
        foreignKey: 'userId',
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
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    phoneNumber: {
      type: DataTypes.STRING,
      validate: {
        is: /^(\+?[0-9]{1,4})?[-\s]?[0-9]{3,12}$/
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
    profilePicture: {
      type: DataTypes.STRING
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    verificationToken: {
      type: DataTypes.STRING
    },
    resetPasswordToken: {
      type: DataTypes.STRING
    },
    resetPasswordExpires: {
      type: DataTypes.DATE
    },
    lastLogin: {
      type: DataTypes.DATE
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    },
    location: {
      type: DataTypes.GEOMETRY('POINT'),
      allowNull: true
    },
    deviceTokens: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    devices: {
      type: DataTypes.ARRAY(DataTypes.JSONB),
      defaultValue: []
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    freezeTableName: true,
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
    }
  });

  return User;
};
