/**
 * index.js - Models and associations for the application
 * IMPORTANT: Replace your existing src/models/index.js with this file
 */

// Import the Sequelize library
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../../config/database').sequelize;

// Define models - proper approach
const User = require('./User')(sequelize, DataTypes);
const ServiceProviderProfile = require('./ServiceProviderProfile')(sequelize, DataTypes);
const ServiceCategory = require('./ServiceCategory')(sequelize, DataTypes);
const Service = require('./Service')(sequelize, DataTypes);
const Booking = require('./Booking')(sequelize, DataTypes);
const Review = require('./Review')(sequelize, DataTypes);
const Payment = require('./Payment')(sequelize, DataTypes);
const Message = require('./Message')(sequelize, DataTypes);
const Notification = require('./Notification')(sequelize, DataTypes);
const DeviceToken = require('./DeviceToken')(sequelize, DataTypes);
const FlaggedContent = require('./FlaggedContent')(sequelize, DataTypes);
const Conversation = require('./Conversation')(sequelize, DataTypes);
const Payout = require('./Payout')(sequelize, DataTypes);
const ServiceProvider = require('./ServiceProvider')(sequelize, DataTypes);
const Transaction = require('./Transaction')(sequelize, DataTypes);
const Invoice = require('./Invoice')(sequelize, DataTypes);
const SubscriptionPlan = require('./SubscriptionPlan')(sequelize, DataTypes);
const PortfolioItem = require('./PortfolioItem')(sequelize, DataTypes);
const PaymentMethod = require('./PaymentMethod')(sequelize, DataTypes);

// Check that models are loaded properly
if (!User || !User.hasMany) {
  console.error('ERROR: User model is not a valid Sequelize model!');
  process.exit(1);
}

// =============================================================================
// Define associations
// =============================================================================

// USER ASSOCIATIONS
// User can have one ServiceProviderProfile
User.hasOne(ServiceProviderProfile, {
  foreignKey: 'userId',
  as: 'providerProfile'
});

// User can have many bookings as a customer
User.hasMany(Booking, {
  foreignKey: 'customerId',
  as: 'bookingsAsCustomer'
});

// User can have many reviews that they wrote
User.hasMany(Review, {
  foreignKey: 'customerId',
  as: 'reviewsWritten'
});

// User can send many messages
User.hasMany(Message, {
  foreignKey: 'senderId',
  as: 'messagesSent'
});

// User can receive many messages
User.hasMany(Message, {
  foreignKey: 'receiverId',
  as: 'messagesReceived'
});

// User can have many notifications
User.hasMany(Notification, {
  foreignKey: 'userId',
  as: 'notifications'
});

// User can have many device tokens
User.hasMany(DeviceToken, {
  foreignKey: 'userId',
  as: 'userdeviceTokens'
});

// SERVICE PROVIDER PROFILE ASSOCIATIONS
// ServiceProviderProfile belongs to a User
ServiceProviderProfile.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// ServiceProviderProfile can offer many services
ServiceProviderProfile.hasMany(Service, {
  foreignKey: 'providerId',
  as: 'services'
});

// ServiceProviderProfile can have many bookings
ServiceProviderProfile.hasMany(Booking, {
  foreignKey: 'providerId',
  as: 'bookings'
});

// ServiceProviderProfile can have many reviews received
ServiceProviderProfile.hasMany(Review, {
  foreignKey: 'providerId',
  as: 'reviews'
});

// ServiceProviderProfile can have many portfolio items
ServiceProviderProfile.hasMany(PortfolioItem, {
  foreignKey: 'providerId',
  as: 'portfolioItems'
});

// SERVICE CATEGORY ASSOCIATIONS
// ServiceCategory can have many services
ServiceCategory.hasMany(Service, {
  foreignKey: 'ServiceCategoryId',
  as: 'services'
});

// SERVICE ASSOCIATIONS
// Service belongs to a ServiceCategory
Service.belongsTo(ServiceCategory, {
  foreignKey: 'ServiceCategoryId',
  as: 'category'
});

// Service belongs to a ServiceProviderProfile
Service.belongsTo(ServiceProviderProfile, {
  foreignKey: 'providerId',
  as: 'provider'
});

// Service can have many bookings
Service.hasMany(Booking, {
  foreignKey: 'serviceId',
  as: 'bookings'
});

// BOOKING ASSOCIATIONS
// Booking belongs to a Customer (User)
Booking.belongsTo(User, {
  foreignKey: 'customerId',
  as: 'customer'
});

// Booking belongs to a ServiceProviderProfile
Booking.belongsTo(ServiceProviderProfile, {
  foreignKey: 'providerId',
  as: 'provider'
});

// Booking belongs to a Service
Booking.belongsTo(Service, {
  foreignKey: 'serviceId',
  as: 'service'
});

// Booking can have one Review
Booking.hasOne(Review, {
  foreignKey: 'bookingId',
  as: 'review'
});

// Booking can have one Payment
Booking.hasOne(Payment, {
  foreignKey: 'bookingId',
  as: 'payment'
});

// Booking can have many Messages
Booking.hasMany(Message, {
  foreignKey: 'bookingId',
  as: 'messages'
});

// REVIEW ASSOCIATIONS
// Review belongs to a Booking
Review.belongsTo(Booking, {
  foreignKey: 'bookingId',
  as: 'booking'
});

// Review belongs to a Customer (User)
Review.belongsTo(User, {
  foreignKey: 'customerId',
  as: 'customer'
});

// Review belongs to a ServiceProviderProfile
Review.belongsTo(ServiceProviderProfile, {
  foreignKey: 'providerId',
  as: 'provider'
});

// MESSAGE ASSOCIATIONS
// Message belongs to a Sender (User)
Message.belongsTo(User, {
  foreignKey: 'senderId',
  as: 'sender'
});

// Message belongs to a Receiver (User)
Message.belongsTo(User, {
  foreignKey: 'receiverId',
  as: 'receiver'
});

// Message belongs to a Booking
Message.belongsTo(Booking, {
  foreignKey: 'bookingId',
  as: 'booking'
});

// CONVERSATION ASSOCIATIONS
// Conversation belongs to a Booking
Conversation.belongsTo(Booking, {
  foreignKey: 'bookingId',
  as: 'booking'
});

// FLAGGED CONTENT ASSOCIATIONS
// FlaggedContent belongs to a Content Author (User)
FlaggedContent.belongsTo(User, {
  foreignKey: 'contentauthorId',
  as: 'contentAuthor'
});

// FlaggedContent belongs to a Reported By (User)
FlaggedContent.belongsTo(User, {
  foreignKey: 'reportedbyId',
  as: 'reportedBy'
});

// FlaggedContent belongs to a Moderated By (User)
FlaggedContent.belongsTo(User, {
  foreignKey: 'moderatedbyId',
  as: 'moderatedBy'
});

// PAYMENT ASSOCIATIONS
// Payment belongs to a Booking
Payment.belongsTo(Booking, {
  foreignKey: 'bookingId',
  as: 'booking'
});

// PAYOUT ASSOCIATIONS
// Payout belongs to a Provider (User)
Payout.belongsTo(User, {
  foreignKey: 'providerId',
  as: 'provider'
});

// NOTIFICATION ASSOCIATIONS
// Notification belongs to a User
Notification.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// DEVICE TOKEN ASSOCIATIONS
// DeviceToken belongs to a User
DeviceToken.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// TRANSACTION ASSOCIATIONS
// Transaction belongs to a User
Transaction.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// PAYMENT METHOD ASSOCIATIONS
// PaymentMethod belongs to a User
PaymentMethod.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Export all models with associations defined
module.exports = {
  User,
  ServiceProviderProfile,
  ServiceCategory,
  Service,
  Booking,
  Review,
  Payment,
  Message,
  Notification,
  DeviceToken,
  FlaggedContent,
  Conversation,
  Payout,
  ServiceProvider,
  Transaction,
  Invoice,
  SubscriptionPlan,
  PortfolioItem,
  PaymentMethod,
  sequelize,  // Export sequelize instance for use elsewhere
};