const User = require('./User');
const ServiceProviderProfile = require('./ServiceProviderProfile');
const ServiceCategory = require('./ServiceCategory');
const Service = require('./Service');
const Booking = require('./Booking');
const Review = require('./Review');
const Payment = require('./Payment');
const Message = require('./Message');

// User - ServiceProviderProfile: One-to-One
User.hasOne(ServiceProviderProfile);
ServiceProviderProfile.belongsTo(User);

// ServiceCategory - Service: One-to-Many
ServiceCategory.hasMany(Service);
Service.belongsTo(ServiceCategory);

// ServiceProviderProfile - Service: One-to-Many
ServiceProviderProfile.hasMany(Service);
Service.belongsTo(ServiceProviderProfile);

// User (Customer) - Booking: One-to-Many
User.hasMany(Booking, { as: 'CustomerBookings', foreignKey: 'customerId' });
Booking.belongsTo(User, { as: 'Customer', foreignKey: 'customerId' });

// ServiceProviderProfile - Booking: One-to-Many
ServiceProviderProfile.hasMany(Booking);
Booking.belongsTo(ServiceProviderProfile);

// Service - Booking: One-to-Many
Service.hasMany(Booking);
Booking.belongsTo(Service);

// Booking - Review: One-to-One
Booking.hasOne(Review);
Review.belongsTo(Booking);

// User (Customer) - Review: One-to-Many
User.hasMany(Review, { as: 'CustomerReviews', foreignKey: 'customerId' });
Review.belongsTo(User, { as: 'Customer', foreignKey: 'customerId' });

// ServiceProviderProfile - Review: One-to-Many
ServiceProviderProfile.hasMany(Review);
Review.belongsTo(ServiceProviderProfile);

// Booking - Payment: One-to-One
Booking.hasOne(Payment);
Payment.belongsTo(Booking);

// User (Sender) - Message: One-to-Many
User.hasMany(Message, { as: 'SentMessages', foreignKey: 'sender_id' });
Message.belongsTo(User, { as: 'Sender', foreignKey: 'sender_id' });

// User (Receiver) - Message: One-to-Many
User.hasMany(Message, { as: 'ReceivedMessages', foreignKey: 'receiver_id' });
Message.belongsTo(User, { as: 'Receiver', foreignKey: 'receiver_id' });

module.exports = {
  User,
  ServiceProviderProfile,
  ServiceCategory,
  Service,
  Booking,
  Review,
  Payment,
  Message
};