// Import models from the correct path
const { User, Booking, Service, ServiceProviderProfile, ServiceCategory } = require('../backend/src/models');
const { createBooking } = require('../backend/src/services/bookingService');
const { v4: uuidv4 } = require('uuid');

describe('Booking Service', () => {
  let userId;
  let serviceId;
  let providerId;
  let ServiceCategoryId;

  beforeEach(async () => {
    try {
      // Create a test user with all required fields
      const user = await User.create({
        id: uuidv4(),  // Generate a valid UUID
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
        email: 'test@example.com',
        phoneNumber: '1234567890',
        role: 'customer',
        isVerified: false,
        status: 'active',
      });
  
      userId = user.id;
  
      // Create a service category (if not already present)
      const category = await ServiceCategory.create({
        id: uuidv4(),
        name: 'Test Category',
      });
  
      ServiceCategoryId = category.id;  // Get the correct categoryId
  
      // Create a service provider profile
      const providerProfile = await ServiceProviderProfile.create({
        user_id: user.id,
        businessName: 'Test Business',
        address: 'Test Address',
        city: 'Test City',
        state: 'Test State',
      });
  
      providerId = providerProfile.id;  // Get the correct providerId from the created profile
  
      // Create a service linked to the provider
      const service = await Service.create({
        id: uuidv4(),  // Generate a valid UUID for service
        title: 'Test Service', // Ensure the title is provided
        description: 'Test Description',
        price: 100,
        duration: 60,
        isActive: true,
        providerId: providerId, // Ensure providerId is linked correctly
        ServiceCategoryId: ServiceCategoryId,  // Ensure the categoryId is valid
        ServiceProviderProfileId: providerProfile.id, // Link to the provider profile
      });
  
      serviceId = service.id;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error; // Re-throw the error so the test will fail
    }
  });

  it('should return success when booking is confirmed', async () => {
    // Arrange: Set up the booking data
    const bookingDate = new Date();
    const startTime = '10:00 AM';
    const endTime = '11:00 AM';
    const notes = 'Test booking';

    // Act: Call the createBooking function
    const result = await createBooking(userId, serviceId, bookingDate, startTime, endTime, notes);

    // Assert: Check that the booking was created successfully
    expect(result.success).toBe(true);
    expect(result.message).toBe('Booking created successfully');
  });

  afterEach(async () => {
    // Clean up test data after each test
    await Booking.destroy({ where: {} });
    await Service.destroy({ where: {} });
    await ServiceProviderProfile.destroy({ where: {} });
    await User.destroy({ where: {} });
    await ServiceCategory.destroy({ where: {} }); // Clean up service category as well
  });
});