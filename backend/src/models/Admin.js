// src/models/Admin.js
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database'); // Adjust path as needed

const AdminModel = sequelize.define('Admin', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'Username cannot be empty'
      },
      len: {
        args: [3, 50],
        msg: 'Username must be between 3 and 50 characters'
      }
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Password cannot be empty'
      },
      len: {
        args: [8, 255],
        msg: 'Password must be at least 8 characters long'
      }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: 'Must be a valid email address'
      }
    }
  },
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'First name cannot be empty'
      }
    }
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Last name cannot be empty'
      }
    }
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  loginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lockedUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'admins',
  timestamps: true,
  hooks: {
    // Hash password before creating
    beforeCreate: async (admin) => {
      if (admin.password) {
        const salt = await bcrypt.genSalt(12);
        admin.password = await bcrypt.hash(admin.password, salt);
      }
    },
    // Hash password before updating if changed
    beforeUpdate: async (admin) => {
      if (admin.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        admin.password = await bcrypt.hash(admin.password, salt);
      }
    },
    // Ensure only one admin exists before creating
    beforeCreate: async (admin) => {
      const existingAdmin = await AdminModel.findOne();
      if (existingAdmin) {
        throw new Error('Only one admin account is allowed. Delete existing admin first.');
      }
    }
  }
});

// Instance methods
AdminModel.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

AdminModel.prototype.isLocked = function() {
  return !!(this.lockedUntil && this.lockedUntil > Date.now());
};

AdminModel.prototype.incrementLoginAttempts = async function() {
  const maxAttempts = 5;
  const lockTime = 30 * 60 * 1000; // 30 minutes

  // If we have a previous lock that has expired, restart at 1
  if (this.lockedUntil && this.lockedUntil < Date.now()) {
    return this.update({
      loginAttempts: 1,
      lockedUntil: null
    });
  }

  const updates = { loginAttempts: this.loginAttempts + 1 };

  // Lock account after max attempts
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
    updates.lockedUntil = Date.now() + lockTime;
  }

  return this.update(updates);
};

AdminModel.prototype.resetLoginAttempts = async function() {
  return this.update({
    loginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: new Date()
  });
};

// Static methods
AdminModel.ensureOnlyOneAdmin = async function() {
  const adminCount = await AdminModel.count();
  if (adminCount > 1) {
    throw new Error('Multiple admin accounts detected. System integrity compromised.');
  }
  return adminCount === 1;
};

AdminModel.replaceAdmin = async function(oldAdminId, newAdminData, transaction = null) {
  const options = transaction ? { transaction } : {};
  
  // Verify old admin exists
  const oldAdmin = await AdminModel.findByPk(oldAdminId, options);
  if (!oldAdmin) {
    throw new Error('Old admin not found');
  }

  // Create new admin and delete old one in transaction
  if (!transaction) {
    return sequelize.transaction(async (t) => {
      return AdminModel.replaceAdmin(oldAdminId, newAdminData, t);
    });
  }

  // Delete old admin first
  await oldAdmin.destroy({ transaction });
  
  // Create new admin
  const newAdmin = await AdminModel.create(newAdminData, { transaction });
  
  return newAdmin;
};

module.exports = AdminModel;