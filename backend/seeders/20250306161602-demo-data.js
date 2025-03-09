// seeders/20250306000000-demo-data.js

'use strict';
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Users
    const userIds = Array(10).fill().map(() => uuidv4());
    const users = [
      {
        id: userIds[0],
        email: 'admin@example.com',
        password_hash: await bcrypt.hash('Password123!', 10),
        first_name: 'Admin',
        last_name: 'User',
        phone_number: '123-456-7890',
        profile_picture_url: 'https://randomuser.me/api/portraits/men/1.jpg',
        bio: 'System administrator',
        role: 'admin',
        is_verified: true,
        is_active: true,
        verification_token: null,
        reset_password_token: null,
        reset_password_expires: null,
        last_login: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: userIds[1],
        email: 'john.doe@example.com',
        password_hash: await bcrypt.hash('Password123!', 10),
        first_name: 'John',
        last_name: 'Doe',
        phone_number: '234-567-8901',
        profile_picture_url: 'https://randomuser.me/api/portraits/men/2.jpg',
        bio: 'Professional plumber with 10 years of experience',
        role: 'provider',
        is_verified: true,
        is_active: true,
        verification_token: null,
        reset_password_token: null,
        reset_password_expires: null,
        last_login: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: userIds[2],
        email: 'jane.smith@example.com',
        password_hash: await bcrypt.hash('Password123!', 10),
        first_name: 'Jane',
        last_name: 'Smith',
        phone_number: '345-678-9012',
        profile_picture_url: 'https://randomuser.me/api/portraits/women/1.jpg',
        bio: 'Licensed electrician specializing in residential wiring',
        role: 'provider',
        is_verified: true,
        is_active: true,
        verification_token: null,
        reset_password_token: null,
        reset_password_expires: null,
        last_login: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: userIds[3],
        email: 'robert.johnson@example.com',
        password_hash: await bcrypt.hash('Password123!', 10),
        first_name: 'Robert',
        last_name: 'Johnson',
        phone_number: '456-789-0123',
        profile_picture_url: 'https://randomuser.me/api/portraits/men/3.jpg',
        bio: 'Experienced painter offering interior and exterior services',
        role: 'provider',
        is_verified: true,
        is_active: true,
        verification_token: null,
        reset_password_token: null,
        reset_password_expires: null,
        last_login: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: userIds[4],
        email: 'mary.williams@example.com',
        password_hash: await bcrypt.hash('Password123!', 10),
        first_name: 'Mary',
        last_name: 'Williams',
        phone_number: '567-890-1234',
        profile_picture_url: 'https://randomuser.me/api/portraits/women/2.jpg',
        bio: 'Customer looking for home improvement services',
        role: 'customer',
        is_verified: true,
        is_active: true,
        verification_token: null,
        reset_password_token: null,
        reset_password_expires: null,
        last_login: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: userIds[5],
        email: 'david.brown@example.com',
        password_hash: await bcrypt.hash('Password123!', 10),
        first_name: 'David',
        last_name: 'Brown',
        phone_number: '678-901-2345',
        profile_picture_url: 'https://randomuser.me/api/portraits/men/4.jpg',
        bio: 'Customer seeking reliable service providers',
        role: 'customer',
        is_verified: true,
        is_active: true,
        verification_token: null,
        reset_password_token: null,
        reset_password_expires: null,
        last_login: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: userIds[6],
        email: 'sarah.miller@example.com',
        password_hash: await bcrypt.hash('Password123!', 10),
        first_name: 'Sarah',
        last_name: 'Miller',
        phone_number: '789-012-3456',
        profile_picture_url: 'https://randomuser.me/api/portraits/women/3.jpg',
        bio: 'Professional gardener and landscaper',
        role: 'provider',
        is_verified: true,
        is_active: true,
        verification_token: null,
        reset_password_token: null,
        reset_password_expires: null,
        last_login: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: userIds[7],
        email: 'michael.davis@example.com',
        password_hash: await bcrypt.hash('Password123!', 10),
        first_name: 'Michael',
        last_name: 'Davis',
        phone_number: '890-123-4567',
        profile_picture_url: 'https://randomuser.me/api/portraits/men/5.jpg',
        bio: 'Customer looking for landscaping services',
        role: 'customer',
        is_verified: true,
        is_active: true,
        verification_token: null,
        reset_password_token: null,
        reset_password_expires: null,
        last_login: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: userIds[8],
        email: 'jennifer.wilson@example.com',
        password_hash: await bcrypt.hash('Password123!', 10),
        first_name: 'Jennifer',
        last_name: 'Wilson',
        phone_number: '901-234-5678',
        profile_picture_url: 'https://randomuser.me/api/portraits/women/4.jpg',
        bio: 'House cleaning professional',
        role: 'provider',
        is_verified: true,
        is_active: true,
        verification_token: null,
        reset_password_token: null,
        reset_password_expires: null,
        last_login: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: userIds[9],
        email: 'william.thompson@example.com',
        password_hash: await bcrypt.hash('Password123!', 10),
        first_name: 'William',
        last_name: 'Thompson',
        phone_number: '012-345-6789',
        profile_picture_url: 'https://randomuser.me/api/portraits/men/6.jpg',
        bio: 'Customer seeking regular cleaning services',
        role: 'customer',
        is_verified: true,
        is_active: true,
        verification_token: null,
        reset_password_token: null,
        reset_password_expires: null,
        last_login: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // 2. User Addresses
    const userAddresses = [
      {
        id: uuidv4(),
        user_id: userIds[0],
        street: '123 Admin St',
        city: 'Adminville',
        state: 'CA',
        zip: '90001',
        country: 'USA',
        latitude: 34.0522,
        longitude: -118.2437,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        user_id: userIds[1],
        street: '456 Provider Ave',
        city: 'Serviceton',
        state: 'NY',
        zip: '10001',
        country: 'USA',
        latitude: 40.7128,
        longitude: -74.0060,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        user_id: userIds[2],
        street: '789 Electrician Rd',
        city: 'Sparksville',
        state: 'TX',
        zip: '75001',
        country: 'USA',
        latitude: 32.7767,
        longitude: -96.7970,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        user_id: userIds[3],
        street: '101 Painter Blvd',
        city: 'Colortown',
        state: 'FL',
        zip: '33101',
        country: 'USA',
        latitude: 25.7617,
        longitude: -80.1918,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        user_id: userIds[4],
        street: '202 Customer Ln',
        city: 'Buyerville',
        state: 'WA',
        zip: '98101',
        country: 'USA',
        latitude: 47.6062,
        longitude: -122.3321,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // 3. Service Categories
    const categoryIds = Array(5).fill().map(() => uuidv4());
    const serviceCategories = [
      {
        id: categoryIds[0],
        name: 'Home Maintenance',
        description: 'Services related to maintaining and repairing homes',
        icon_url: '/icons/home-maintenance.svg',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: categoryIds[1],
        name: 'Cleaning',
        description: 'Professional cleaning services for homes and offices',
        icon_url: '/icons/cleaning.svg',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: categoryIds[2],
        name: 'Landscaping',
        description: 'Outdoor services including gardening and lawn care',
        icon_url: '/icons/landscaping.svg',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: categoryIds[3],
        name: 'Electrical',
        description: 'Services related to electrical systems and installations',
        icon_url: '/icons/electrical.svg',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: categoryIds[4],
        name: 'Plumbing',
        description: 'Water system installation, maintenance, and repair',
        icon_url: '/icons/plumbing.svg',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // 4. Service Subcategories
    const subcategoryIds = Array(15).fill().map(() => uuidv4());
    const serviceSubcategories = [
      {
        id: subcategoryIds[0],
        category_id: categoryIds[0],
        name: 'Painting',
        description: 'Interior and exterior painting services',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: subcategoryIds[1],
        category_id: categoryIds[0],
        name: 'Drywall Repair',
        description: 'Patching and fixing walls',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: subcategoryIds[2],
        category_id: categoryIds[0],
        name: 'Flooring',
        description: 'Installation and repair of various flooring types',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: subcategoryIds[3],
        category_id: categoryIds[1],
        name: 'House Cleaning',
        description: 'Regular or deep cleaning of homes',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: subcategoryIds[4],
        category_id: categoryIds[1],
        name: 'Office Cleaning',
        description: 'Commercial space cleaning services',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: subcategoryIds[5],
        category_id: categoryIds[1],
        name: 'Carpet Cleaning',
        description: 'Deep cleaning of carpets and rugs',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: subcategoryIds[6],
        category_id: categoryIds[2],
        name: 'Lawn Mowing',
        description: 'Regular grass cutting services',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: subcategoryIds[7],
        category_id: categoryIds[2],
        name: 'Garden Design',
        description: 'Planning and implementing garden layouts',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: subcategoryIds[8],
        category_id: categoryIds[2],
        name: 'Tree Trimming',
        description: 'Pruning and shaping trees',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: subcategoryIds[9],
        category_id: categoryIds[3],
        name: 'Wiring Installation',
        description: 'New electrical wiring for homes and businesses',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: subcategoryIds[10],
        category_id: categoryIds[3],
        name: 'Light Fixture Installation',
        description: 'Installing and replacing light fixtures',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: subcategoryIds[11],
        category_id: categoryIds[3],
        name: 'Electrical Repairs',
        description: 'Fixing electrical problems',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: subcategoryIds[12],
        category_id: categoryIds[4],
        name: 'Pipe Repair',
        description: 'Fixing leaky or broken pipes',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: subcategoryIds[13],
        category_id: categoryIds[4],
        name: 'Fixture Installation',
        description: 'Installing sinks, toilets, and other fixtures',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: subcategoryIds[14],
        category_id: categoryIds[4],
        name: 'Drain Cleaning',
        description: 'Clearing clogged drains',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // 5. Service Provider Profiles
    const providerIds = Array(5).fill().map(() => uuidv4());
    const serviceProviderProfiles = [
      {
        id: providerIds[0],
        user_id: userIds[1],
        business_name: 'Doe Plumbing Services',
        business_description: 'Professional plumbing services with 24/7 emergency support',
        years_of_experience: 10,
        is_verified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: providerIds[1],
        user_id: userIds[2],
        business_name: 'Smith Electrical Solutions',
        business_description: 'Licensed electrician specializing in residential and commercial properties',
        years_of_experience: 8,
        is_verified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: providerIds[2],
        user_id: userIds[3],
        business_name: 'Johnson Painting Pro',
        business_description: 'Quality interior and exterior painting services',
        years_of_experience: 15,
        is_verified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: providerIds[3],
        user_id: userIds[6],
        business_name: 'Miller Landscaping',
        business_description: 'Complete landscaping and garden maintenance services',
        years_of_experience: 12,
        is_verified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: providerIds[4],
        user_id: userIds[8],
        business_name: 'Wilson Cleaning Services',
        business_description: 'Professional cleaning for homes and offices',
        years_of_experience: 5,
        is_verified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // 6. Provider Services
    const providerServiceIds = Array(15).fill().map(() => uuidv4());
    const providerServices = [
      {
        id: providerServiceIds[0],
        provider_id: providerIds[0],
        service_name: 'Pipe Repair',
        description: 'Fix leaky or damaged pipes in your home',
        price: 85.00,
        availability: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: providerServiceIds[1],
        provider_id: providerIds[0],
        service_name: 'Drain Unclogging',
        description: 'Clear clogged drains quickly and effectively',
        price: 75.00,
        availability: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: providerServiceIds[2],
        provider_id: providerIds[0],
        service_name: 'Fixture Installation',
        description: 'Install new sinks, toilets, and other fixtures',
        price: 120.00,
        availability: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: providerServiceIds[3],
        provider_id: providerIds[1],
        service_name: 'Electrical Panel Upgrade',
        description: 'Upgrade your electrical panel for increased capacity',
        price: 850.00,
        availability: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: providerServiceIds[4],
        provider_id: providerIds[1],
        service_name: 'Wiring Installation',
        description: 'Install new wiring for home additions or renovations',
        price: 200.00,
        availability: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: providerServiceIds[5],
        provider_id: providerIds[1],
        service_name: 'Light Fixture Installation',
        description: 'Install ceiling lights, chandeliers, and other fixtures',
        price: 95.00,
        availability: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: providerServiceIds[6],
        provider_id: providerIds[2],
        service_name: 'Interior Painting',
        description: 'Quality interior painting for all rooms',
        price: 2.50, // per square foot
        availability: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: providerServiceIds[7],
        provider_id: providerIds[2],
        service_name: 'Exterior Painting',
        description: 'Durable exterior painting that withstands the elements',
        price: 3.50, // per square foot
        availability: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: providerServiceIds[8],
        provider_id: providerIds[2],
        service_name: 'Deck Staining',
        description: 'Protect and beautify your deck with professional staining',
        price: 4.00, // per square foot
        availability: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: providerServiceIds[9],
        provider_id: providerIds[3],
        service_name: 'Lawn Mowing',
        description: 'Regular lawn mowing service',
        price: 45.00,
        availability: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: providerServiceIds[10],
        provider_id: providerIds[3],
        service_name: 'Garden Design',
        description: 'Professional garden design and implementation',
        price: 500.00,
        availability: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: providerServiceIds[11],
        provider_id: providerIds[3],
        service_name: 'Tree Trimming',
        description: 'Safe and professional tree trimming service',
        price: 150.00,
        availability: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: providerServiceIds[12],
        provider_id: providerIds[4],
        service_name: 'Regular House Cleaning',
        description: 'Weekly or bi-weekly house cleaning service',
        price: 120.00,
        availability: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: providerServiceIds[13],
        provider_id: providerIds[4],
        service_name: 'Deep Cleaning',
        description: 'Thorough deep cleaning for homes',
        price: 250.00,
        availability: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: providerServiceIds[14],
        provider_id: providerIds[4],
        service_name: 'Office Cleaning',
        description: 'Commercial space cleaning services',
        price: 180.00,
        availability: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // 7. Portfolio Items
    const portfolioItems = [
      {
        id: uuidv4(),
        provider_id: providerIds[0],
        image_url: '/portfolio/plumbing-1.jpg',
        description: 'Bathroom renovation with new fixtures installation',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        provider_id: providerIds[0],
        image_url: '/portfolio/plumbing-2.jpg',
        description: 'Kitchen sink and disposal installation',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        provider_id: providerIds[1],
        image_url: '/portfolio/electrical-1.jpg',
        description: 'Home rewiring project completed safely',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        provider_id: providerIds[1],
        image_url: '/portfolio/electrical-2.jpg',
        description: 'Panel upgrade to 200 amp service',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        provider_id: providerIds[2],
        image_url: '/portfolio/painting-1.jpg',
        description: 'Living room transformation with accent wall',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        provider_id: providerIds[2],
        image_url: '/portfolio/painting-2.jpg',
        description: 'Exterior painting of two-story home',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        provider_id: providerIds[3],
        image_url: '/portfolio/landscaping-1.jpg',
        description: 'Front yard landscape design with native plants',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        provider_id: providerIds[3],
        image_url: '/portfolio/landscaping-2.jpg',
        description: 'Backyard transformation with patio and garden',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        provider_id: providerIds[4],
        image_url: '/portfolio/cleaning-1.jpg',
        description: 'Before and after deep cleaning of kitchen',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        provider_id: providerIds[4],
        image_url: '/portfolio/cleaning-2.jpg',
        description: 'Office space cleaned and sanitized',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // 8. Bookings
    const bookingIds = Array(8).fill().map(() => uuidv4());
    const bookings = [
      {
        id: bookingIds[0],
        user_id: userIds[4], // Mary Williams (customer)
        provider_id: userIds[1], // John Doe (plumber)
        booking_date: new Date(2025, 2, 10), // March 10, 2025
        start_time: '09:00:00',
        end_time: '11:00:00',
        status: 'completed',
        cancellation_reason: null,
        createdAt: new Date(2025, 2, 1),
        updatedAt: new Date(2025, 2, 1)
      },
      {
        id: bookingIds[1],
        user_id: userIds[4], // Mary Williams (customer)
        provider_id: userIds[2], // Jane Smith (electrician)
        booking_date: new Date(2025, 2, 15), // March 15, 2025
        start_time: '14:00:00',
        end_time: '16:00:00',
        status: 'confirmed',
        cancellation_reason: null,
        createdAt: new Date(2025, 2, 2),
        updatedAt: new Date(2025, 2, 2)
      },
      {
        id: bookingIds[2],
        user_id: userIds[5], // David Brown (customer)
        provider_id: userIds[3], // Robert Johnson (painter)
        booking_date: new Date(2025, 2, 20), // March 20, 2025
        start_time: '10:00:00',
        end_time: '17:00:00',
        status: 'confirmed',
        cancellation_reason: null,
        createdAt: new Date(2025, 2, 3),
        updatedAt: new Date(2025, 2, 3)
      },
      {
        id: bookingIds[3],
        user_id: userIds[5], // David Brown (customer)
        provider_id: userIds[6], // Sarah Miller (gardener)
        booking_date: new Date(2025, 2, 22), // March 22, 2025
        start_time: '08:00:00',
        end_time: '12:00:00',
        status: 'confirmed',
        cancellation_reason: null,
        createdAt: new Date(2025, 2, 4),
        updatedAt: new Date(2025, 2, 4)
      },
      {
        id: bookingIds[4],
        user_id: userIds[7], // Michael Davis (customer)
        provider_id: userIds[6], // Sarah Miller (gardener)
        booking_date: new Date(2025, 2, 25), // March 25, 2025
        start_time: '13:00:00',
        end_time: '17:00:00',
        status: 'pending',
        cancellation_reason: null,
        createdAt: new Date(2025, 2, 5),
        updatedAt: new Date(2025, 2, 5)
      },
      {
        id: bookingIds[5],
        user_id: userIds[7], // Michael Davis (customer)
        provider_id: userIds[8], // Jennifer Wilson (cleaner)
        booking_date: new Date(2025, 2, 18), // March 18, 2025
        start_time: '09:00:00',
        end_time: '12:00:00',
        status: 'cancelled',
        cancellation_reason: 'Schedule conflict',
        createdAt: new Date(2025, 2, 1),
        updatedAt: new Date(2025, 2, 6)
      },
      {
        id: bookingIds[6],
        user_id: userIds[9], // William Thompson (customer)
        provider_id: userIds[8], // Jennifer Wilson (cleaner)
        booking_date: new Date(2025, 3, 1), // April 1, 2025
        start_time: '10:00:00',
        end_time: '13:00:00',
        status: 'confirmed',
        cancellation_reason: null,
        createdAt: new Date(2025, 2, 7),
        updatedAt: new Date(2025, 2, 7)
      },
      {
        id: bookingIds[7],
        user_id: userIds[9], // William Thompson (customer)
        provider_id: userIds[1], // John Doe (plumber)
        booking_date: new Date(2025, 3, 5), // April 5, 2025
        start_time: '13:00:00',
        end_time: '15:00:00',
        status: 'pending',
        cancellation_reason: null,
        createdAt: new Date(2025, 2, 8),
        updatedAt: new Date(2025, 2, 8)
      }
    ];

    // 9. Transactions
    const transactionIds = Array(5).fill().map(() => uuidv4());
    const transactions = [
      {
        id: transactionIds[0],
        user_id: userIds[4], // Mary Williams (customer)
        amount: 170.00,
        platform_fee: 17.00,
        provider_payout: 153.00,
        status: 'completed',
        createdAt: new Date(2025, 2, 10),
        updatedAt: new Date(2025, 2, 10)
      },
      {
        id: transactionIds[1],
        user_id: userIds[5], // David Brown (customer)
        amount: 750.00,
        platform_fee: 75.00,
        provider_payout: 675.00,
        status: 'pending',
        createdAt: new Date(2025, 2, 20),
        updatedAt: new Date(2025, 2, 20)
      },
      {
        id: transactionIds[2],
        user_id: userIds[7], // Michael Davis (customer)
        amount: 180.00,
        platform_fee: 18.00,
        provider_payout: 162.00,
        status: 'refunded',
        createdAt: new Date(2025, 2, 18),
        updatedAt: new Date(2025, 2, 18)
      },
      {
        id: transactionIds[3],
        user_id: userIds[9], // William Thompson (customer)
        amount: 120.00,
        platform_fee: 12.00,
        provider_payout: 108.00,
        status: 'pending',
        createdAt: new Date(2025, 3, 1),
        updatedAt: new Date(2025, 3, 1)
      },
      {
        id: transactionIds[4],
        user_id: userIds[4], // Mary Williams (customer)
        amount: 200.00,
        platform_fee: 20.00,
        provider_payout: 180.00,
        status: 'pending',
        createdAt: new Date(2025, 2, 15),
        updatedAt: new Date(2025, 2, 15)
      }
    ];

    // 10. Payment Methods
    const paymentMethods = [
      {
        id: uuidv4(),
        user_id: userIds[4], // Mary Williams (customer)
        card_number: '************4242',
        expiry_date: '12/27',
        cvc: '***',
        billing_address: '202 Customer Ln, Buyerville, WA 98101',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        user_id: userIds[5], // David Brown (customer)
        card_number: '************5555',
        expiry_date: '10/26',
        cvc: '***',
        billing_address: '303 Client St, Clientville, CA 90001',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        user_id: userIds[7], // Michael Davis (customer)
        card_number: '************1111',
        expiry_date: '08/28',
        cvc: '***',
        billing_address: '404 User Ave, Userville, NY 10001',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        user_id: userIds[9], // William Thompson (customer)
        card_number: '************9999',
        expiry_date: '06/26',
        cvc: '***',
        billing_address: '505 Person Blvd, Personville, TX 75001',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // 11. Invoices
    const invoices = [
      {
        id: uuidv4(),
        user_id: userIds[4], // Mary Williams (customer)
        transaction_id: transactionIds[0],
        amount: 170.00,
        status: 'paid',
        createdAt: new Date(2025, 2, 10),
        updatedAt: new Date(2025, 2, 10)
      },
      {
        id: uuidv4(),
        user_id: userIds[5], // David Brown (customer)
        transaction_id: transactionIds[1],
        amount: 750.00,
        status: 'pending',
        createdAt: new Date(2025, 2, 20),
        updatedAt: new Date(2025, 2, 20)
      },
      {
        id: uuidv4(),
        user_id: userIds[7], // Michael Davis (customer)
        transaction_id: transactionIds[2],
        amount: 180.00,
        status: 'refunded',
        createdAt: new Date(2025, 2, 18),
        updatedAt: new Date(2025, 2, 18)
      },
      {
        id: uuidv4(),
        user_id: userIds[9], // William Thompson (customer)
        transaction_id: transactionIds[3],
        amount: 120.00,
        status: 'pending',
        createdAt: new Date(2025, 3, 1),
        updatedAt: new Date(2025, 3, 1)
      },
      {
        id: uuidv4(),
        user_id: userIds[4], // Mary Williams (customer)
        transaction_id: transactionIds[4],
        amount: 200.00,
        status: 'pending',
        createdAt: new Date(2025, 2, 15),
        updatedAt: new Date(2025, 2, 15)
      }
    ];

    // 12. Reviews
    const reviews = [
      {
        id: uuidv4(),
        user_id: userIds[4], // Mary Williams (customer)
        provider_id: userIds[1], // John Doe (plumber)
        rating: 5,
        review_text: 'John did an excellent job fixing our leaky pipes. Very professional and clean work.',
        provider_response: 'Thank you for your kind words! It was a pleasure working with you.',
        review_date: new Date(2025, 2, 11),
        createdAt: new Date(2025, 2, 11),
        updatedAt: new Date(2025, 2, 11)
      },
      {
        id: uuidv4(),
        user_id: userIds[5], // David Brown (customer)
        provider_id: userIds[3], // Robert Johnson (painter)
        rating: 4,
        review_text: 'Great painting job overall. A few minor touch-ups needed but Robert was quick to fix them.',
        provider_response: 'I appreciate your feedback and am glad we could address those touch-ups for you!',
        review_date: new Date(2025, 2, 21),
        createdAt: new Date(2025, 2, 21),
        updatedAt: new Date(2025, 2, 21)
      },
      {
        id: uuidv4(),
        user_id: userIds[7], // Michael Davis (customer)
        provider_id: userIds[6], // Sarah Miller (gardener)
        rating: 5,
        review_text: 'Sarah transformed our garden completely! Her design skills are amazing.',
        provider_response: 'Thank you so much! I enjoyed working on your garden project.',
        review_date: new Date(2025, 2, 26),
        createdAt: new Date(2025, 2, 26),
        updatedAt: new Date(2025, 2, 26)
      },
      {
        id: uuidv4(),
        user_id: userIds[9], // William Thompson (customer)
        provider_id: userIds[8], // Jennifer Wilson (cleaner)
        rating: 3,
        review_text: 'The cleaning was good but some areas were missed. Jennifer was responsive to feedback though.',
        provider_response: 'I apologize for missing those areas and appreciate your feedback. I will ensure more attention to detail next time.',
        review_date: new Date(2025, 2, 2),
        createdAt: new Date(2025, 3, 2),
        updatedAt: new Date(2025, 3, 2)
      }
    ];

    // 13. Messages
    const messageThreadIds = Array(3).fill().map(() => uuidv4());
    const messages = [
      {
        id: uuidv4(),
        sender_id: userIds[4], // Mary Williams (customer)
        receiver_id: userIds[1], // John Doe (plumber)
        message_text: 'Hi John, I have a leaky faucet in my kitchen. Are you available this week?',
        message_thread_id: messageThreadIds[0],
        createdAt: new Date(2025, 2, 5, 9, 30), // March 5, 9:30 AM
        updatedAt: new Date(2025, 2, 5, 9, 30)
      },
      {
        id: uuidv4(),
        sender_id: userIds[1], // John Doe (plumber)
        receiver_id: userIds[4], // Mary Williams (customer)
        message_text: 'Hello Mary, I can come by on Thursday between 9-11 AM. Would that work for you?',
        message_thread_id: messageThreadIds[0],
        createdAt: new Date(2025, 2, 5, 10, 15), // March 5, 10:15 AM
        updatedAt: new Date(2025, 2, 5, 10, 15)
      },
      {
        id: uuidv4(),
        sender_id: userIds[4], // Mary Williams (customer)
        receiver_id: userIds[1], // John Doe (plumber)
        message_text: 'Thursday at 9 AM works perfectly. Looking forward to getting this fixed!',
        message_thread_id: messageThreadIds[0],
        createdAt: new Date(2025, 2, 5, 11, 0), // March 5, 11:00 AM
        updatedAt: new Date(2025, 2, 5, 11, 0)
      },
      {
        id: uuidv4(),
        sender_id: userIds[5], // David Brown (customer)
        receiver_id: userIds[3], // Robert Johnson (painter)
        message_text: 'Hi Robert, I am interested in getting my living room painted. Can you provide a quote?',
        message_thread_id: messageThreadIds[1],
        createdAt: new Date(2025, 2, 18, 14, 0), // March 18, 2:00 PM
        updatedAt: new Date(2025, 2, 18, 14, 0)
      },
      {
        id: uuidv4(),
        sender_id: userIds[3], // Robert Johnson (painter)
        receiver_id: userIds[5], // David Brown (customer)
        message_text: 'Hello David, I would be happy to give you a quote. Could you share the dimensions of your living room and any specific color preferences?',
        message_thread_id: messageThreadIds[1],
        createdAt: new Date(2025, 2, 18, 15, 30), // March 18, 3:30 PM
        updatedAt: new Date(2025, 2, 18, 15, 30)
      },
      {
        id: uuidv4(),
        sender_id: userIds[9], // William Thompson (customer)
        receiver_id: userIds[8], // Jennifer Wilson (cleaner)
        message_text: 'Hi Jennifer, do you offer weekly cleaning services for a 2-bedroom apartment?',
        message_thread_id: messageThreadIds[2],
        createdAt: new Date(2025, 2, 25, 10, 0), // March 25, 10:00 AM
        updatedAt: new Date(2025, 2, 25, 10, 0)
      },
      {
        id: uuidv4(),
        sender_id: userIds[8], // Jennifer Wilson (cleaner)
        receiver_id: userIds[9], // William Thompson (customer)
        message_text: 'Hello William, yes I do offer weekly cleaning services for apartments. My rate for a 2-bedroom is $120 per week. Would you like to schedule a first cleaning?',
        message_thread_id: messageThreadIds[2],
        createdAt: new Date(2025, 2, 25, 10, 45), // March 25, 10:45 AM
        updatedAt: new Date(2025, 2, 25, 10, 45)
      }
    ];

    // 14. Notifications
    const notifications = [
      {
        id: uuidv4(),
        user_id: userIds[1], // John Doe (plumber)
        message: 'You have a new booking request from Mary Williams',
        is_read: true,
        createdAt: new Date(2025, 2, 5),
        updatedAt: new Date(2025, 2, 5)
      },
      {
        id: uuidv4(),
        user_id: userIds[4], // Mary Williams (customer)
        message: 'Your booking with John Doe has been confirmed',
        is_read: true,
        createdAt: new Date(2025, 2, 6),
        updatedAt: new Date(2025, 2, 6)
      },
      {
        id: uuidv4(),
        user_id: userIds[4], // Mary Williams (customer)
        message: 'Your service with John Doe has been completed. Please leave a review.',
        is_read: false,
        createdAt: new Date(2025, 2, 10),
        updatedAt: new Date(2025, 2, 10)
      },
      {
        id: uuidv4(),
        user_id: userIds[1], // John Doe (plumber)
        message: 'Mary Williams has left a review for your service',
        is_read: false,
        createdAt: new Date(2025, 2, 11),
        updatedAt: new Date(2025, 2, 11)
      },
      {
        id: uuidv4(),
        user_id: userIds[3], // Robert Johnson (painter)
        message: 'You have a new message from David Brown',
        is_read: true,
        createdAt: new Date(2025, 2, 18),
        updatedAt: new Date(2025, 2, 18)
      },
      {
        id: uuidv4(),
        user_id: userIds[8], // Jennifer Wilson (cleaner)
        message: 'You have a new message from William Thompson',
        is_read: false,
        createdAt: new Date(2025, 2, 25),
        updatedAt: new Date(2025, 2, 25)
      },
      {
        id: uuidv4(),
        user_id: userIds[6], // Sarah Miller (gardener)
        message: 'You have a new booking request from Michael Davis',
        is_read: false,
        createdAt: new Date(2025, 2, 5),
        updatedAt: new Date(2025, 2, 5)
      }
    ];

    // 15. Device Tokens
    const deviceTokens = [
      {
        id: uuidv4(),
        user_id: userIds[0],
        token: 'fcm-token-admin-ios-1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        user_id: userIds[1],
        token: 'fcm-token-provider1-android-1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        user_id: userIds[2],
        token: 'fcm-token-provider2-ios-1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        user_id: userIds[4],
        token: 'fcm-token-customer1-android-1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        user_id: userIds[5],
        token: 'fcm-token-customer2-ios-1',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // 16. Subscription Plans
    const subscriptionPlans = [
      {
        id: uuidv4(),
        name: 'Basic Provider',
        price: 0.00,
        features: 'Limited profile visibility, 5% platform fee, Basic support',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Pro Provider',
        price: 19.99,
        features: 'Enhanced profile visibility, 3% platform fee, Priority support, Featured in search results',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Premium Provider',
        price: 39.99,
        features: 'Maximum profile visibility, 2% platform fee, 24/7 Premium support, Top placement in search results, Verified badge',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Insert all data in the correct order to maintain referential integrity
    await queryInterface.bulkInsert('Users', users, {});
    await queryInterface.bulkInsert('UserAddresses', userAddresses, {});
    await queryInterface.bulkInsert('ServiceCategories', serviceCategories, {});
    await queryInterface.bulkInsert('ServiceSubcategories', serviceSubcategories, {});
    await queryInterface.bulkInsert('ServiceProviderProfiles', serviceProviderProfiles, {});
    await queryInterface.bulkInsert('ProviderServices', providerServices, {});
    await queryInterface.bulkInsert('PortfolioItems', portfolioItems, {});
    await queryInterface.bulkInsert('Bookings', bookings, {});
    await queryInterface.bulkInsert('Transactions', transactions, {});
    await queryInterface.bulkInsert('PaymentMethods', paymentMethods, {});
    await queryInterface.bulkInsert('Invoices', invoices, {});
    await queryInterface.bulkInsert('Reviews', reviews, {});
    await queryInterface.bulkInsert('Messages', messages, {});
    await queryInterface.bulkInsert('Notifications', notifications, {});
    await queryInterface.bulkInsert('DeviceTokens', deviceTokens, {});
    await queryInterface.bulkInsert('SubscriptionPlans', subscriptionPlans, {});
  },

  down: async (queryInterface, Sequelize) => {
    // Remove data in reverse order to maintain referential integrity
    await queryInterface.bulkDelete('SubscriptionPlans', null, {});
    await queryInterface.bulkDelete('DeviceTokens', null, {});
    await queryInterface.bulkDelete('Notifications', null, {});
    await queryInterface.bulkDelete('Messages', null, {});
    await queryInterface.bulkDelete('Reviews', null, {});
    await queryInterface.bulkDelete('Invoices', null, {});
    await queryInterface.bulkDelete('PaymentMethods', null, {});
    await queryInterface.bulkDelete('Transactions', null, {});
    await queryInterface.bulkDelete('Bookings', null, {});
    await queryInterface.bulkDelete('PortfolioItems', null, {});
    await queryInterface.bulkDelete('ProviderServices', null, {});
    await queryInterface.bulkDelete('ServiceProviderProfiles', null, {});
    await queryInterface.bulkDelete('ServiceSubcategories', null, {});
    await queryInterface.bulkDelete('ServiceCategories', null, {});
    await queryInterface.bulkDelete('UserAddresses', null, {});
    await queryInterface.bulkDelete('Users', null, {});
  }
};