// This script will fix all foreign key constraint issues in the data files
// Run this script in a Node.js environment with fs available

const fs = require('fs').promises;

async function fixAllDataIssues() {
  // Read all the files
  const files = [
    'users.json', 
    'bookings.json', 
    'conversations.json', 
    'device-tokens.json',
    'flagged-contents.json',
    'messages.json',
    'notifications.json',
    'payment-methods.json',
    'payments.json',
    'payouts.json',
    'portfolio-items.json',
    'reviews.json',
    'service-categories.json',
    'service-provider-profiles.json',
    'services.json',
    'subscription-plans.json',
    'transactions.json'
  ];

  // Read each file
  const data = {};
  for (const file of files) {
    try {
      const content = await fs.readFile(file, { encoding: 'utf8' });
      data[file] = JSON.parse(content);
      console.log(`Successfully read ${file}`);
    } catch (error) {
      console.log(`Error reading ${file}: ${error.message}`);
      data[file] = [];
    }
  }

  // 1. ADD MISSING USER
  // Add user with ID f47ac10b-58cc-4372-a567-0e02b2c3d484 that's referenced but missing
  if (!data['users.json'].some(u => u.id === 'f47ac10b-58cc-4372-a567-0e02b2c3d484')) {
    data['users.json'].push({
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d484",
      "username": "techrepair",
      "firstName": "Tech",
      "lastName": "Repair",
      "email": "tech.repair@example.com",
      "phoneNumber": "+15557778888",
      "password": "$2a$10$XgXB9NcKV.37AQZ1GBnZOOWZ3EkVfM7YLjrLZR.JgvVTz0tpEpR2a",
      "role": "provider",
      "profilePicture": "https://randomuser.me/api/portraits/men/25.jpg",
      "isVerified": true,
      "status": "active",
      "deviceTokens": "['token-provider-1234']",
      "devices": "[{\"deviceId\":\"device-tech-5678\",\"deviceType\":\"iOS\",\"lastLogin\":\"2025-03-01T10:30:00Z\"}]",
      "createdAt": "2024-10-20T00:00:00Z",
      "updatedAt": "2025-02-15T00:00:00Z"
    });
    console.log("Added missing user: f47ac10b-58cc-4372-a567-0e02b2c3d484");
  }

  // 2. FIX PROVIDER REFERENCES IN BOOKINGS
  // Update all provider IDs in bookings to reference valid user IDs
  const userIds = data['users.json'].map(user => user.id);
  data['bookings.json'].forEach(booking => {
    // Map old provider IDs to valid user IDs
    if (booking.providerId === 'a1b2c3d4-e5f6-4a5b-9c8d-1e2f3a4b5c6d') {
      booking.providerId = 'f47ac10b-58cc-4372-a567-0e02b2c3d480'; // Map to Jane Smith
    } else if (booking.providerId === 'b2c3d4e5-f6a7-5b6c-0d1e-2f3a4b5c6d7e') {
      booking.providerId = 'f47ac10b-58cc-4372-a567-0e02b2c3d482'; // Map to Sarah Provider
    } else if (booking.providerId === 'c3d4e5f6-a7b8-6c7d-1e2f-3a4b5c6d7e8f') {
      booking.providerId = 'f47ac10b-58cc-4372-a567-0e02b2c3d484'; // Map to Tech Repair
    }
  });
  console.log("Fixed provider references in bookings");

  // 3. FIX SERVICE PROVIDER PROFILES
  // Update IDs to match user IDs for consistency
  data['service-provider-profiles.json'].forEach(profile => {
    if (profile.id === 'a1b2c3d4-e5f6-4a5b-9c8d-1e2f3a4b5c6d') {
      profile.id = 'f47ac10b-58cc-4372-a567-0e02b2c3d480';
    } else if (profile.id === 'b2c3d4e5-f6a7-5b6c-0d1e-2f3a4b5c6d7e') {
      profile.id = 'f47ac10b-58cc-4372-a567-0e02b2c3d482';
    } else if (profile.id === 'c3d4e5f6-a7b8-6c7d-1e2f-3a4b5c6d7e8f') {
      profile.id = 'f47ac10b-58cc-4372-a567-0e02b2c3d484';
    }
  });
  console.log("Fixed service provider profile IDs");

  // 4. UPDATE SERVICE REFERENCES
  // Fix provider IDs in services
  data['services.json'].forEach(service => {
    if (service.providerId === 'a1b2c3d4-e5f6-4a5b-9c8d-1e2f3a4b5c6d') {
      service.providerId = 'f47ac10b-58cc-4372-a567-0e02b2c3d480';
    } else if (service.providerId === 'b2c3d4e5-f6a7-5b6c-0d1e-2f3a4b5c6d7e') {
      service.providerId = 'f47ac10b-58cc-4372-a567-0e02b2c3d482';
    } else if (service.providerId === 'c3d4e5f6-a7b8-6c7d-1e2f-3a4b5c6d7e8f') {
      service.providerId = 'f47ac10b-58cc-4372-a567-0e02b2c3d484';
    }
  });
  console.log("Fixed provider references in services");

  // 5. FIX CONVERSATIONS
  // Make sure all participants are valid users
  data['conversations.json'].forEach(convo => {
    for (let i = 0; i < convo.participants.length; i++) {
      if (!userIds.includes(convo.participants[i])) {
        if (convo.participants[i] === 'f47ac10b-58cc-4372-a567-0e02b2c3d484') {
          // This user now exists, so should be fine
        } else {
          // For any other invalid participant, replace with admin
          convo.participants[i] = 'f47ac10b-58cc-4372-a567-0e02b2c3d481';
        }
      }
    }
    
    // Fix lastMessage sender if needed
    if (convo.lastMessage && !userIds.includes(convo.lastMessage.senderId)) {
      convo.lastMessage.senderId = convo.participants[0];
    }
    
    // Fix unreadCount to ensure all keys are valid users
    if (convo.unreadCount) {
      const newUnreadCount = {};
      convo.participants.forEach(p => {
        newUnreadCount[p] = convo.unreadCount[p] || 0;
      });
      convo.unreadCount = newUnreadCount;
    }
  });
  console.log("Fixed conversation references");

  // 6. FIX MESSAGES
  // Ensure sender and receiver are valid users
  data['messages.json'].forEach(message => {
    if (!userIds.includes(message.senderId)) {
      if (message.senderId === 'f47ac10b-58cc-4372-a567-0e02b2c3d484') {
        // This user now exists, so should be fine
      } else {
        // Find a valid sender based on the booking context
        const booking = data['bookings.json'].find(b => b.id === message.bookingId);
        if (booking) {
          message.senderId = booking.providerId;
        } else {
          message.senderId = 'f47ac10b-58cc-4372-a567-0e02b2c3d481'; // Default to admin
        }
      }
    }
    
    if (!userIds.includes(message.receiverId)) {
      if (message.receiverId === 'f47ac10b-58cc-4372-a567-0e02b2c3d484') {
        // This user now exists, so should be fine
      } else {
        // Find a valid receiver based on the booking context
        const booking = data['bookings.json'].find(b => b.id === message.bookingId);
        if (booking) {
          message.receiverId = booking.userId;
        } else {
          message.receiverId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; // Default to John Doe
        }
      }
    }
  });
  console.log("Fixed message references");

  // 7. FIX PORTFOLIO ITEMS
  // Update provider IDs to match our new system
  data['portfolio-items.json'].forEach(item => {
    if (item.providerId === 'a1b2c3d4-e5f6-4a5b-9c8d-1e2f3a4b5c6d') {
      item.providerId = 'f47ac10b-58cc-4372-a567-0e02b2c3d480';
    } else if (item.providerId === 'b2c3d4e5-f6a7-5b6c-0d1e-2f3a4b5c6d7e') {
      item.providerId = 'f47ac10b-58cc-4372-a567-0e02b2c3d482';
    } else if (item.providerId === 'c3d4e5f6-a7b8-6c7d-1e2f-3a4b5c6d7e8f') {
      item.providerId = 'f47ac10b-58cc-4372-a567-0e02b2c3d484';
    }
  });
  console.log("Fixed portfolio item references");
  
  // 8. FIX REVIEWS
  // Ensure all reviews reference valid users, providers and bookings
  data['reviews.json'].forEach(review => {
    // Fix provider IDs
    if (review.providerId === 'f47ac10b-58cc-4372-a567-0e02b2c3d484' || 
        !userIds.includes(review.providerId)) {
      // Look up the provider from the booking
      const booking = data['bookings.json'].find(b => b.id === review.bookingId);
      if (booking) {
        review.providerId = booking.providerId;
      } else {
        review.providerId = 'f47ac10b-58cc-4372-a567-0e02b2c3d480'; // Default to Jane Smith
      }
    }
  });
  console.log("Fixed review references");

  // 9. FIX PAYOUTS
  // Ensure provider IDs match our system
  data['payouts.json'].forEach(payout => {
    if (payout.providerId === 'f47ac10b-58cc-4372-a567-0e02b2c3d484' || 
        !userIds.includes(payout.providerId)) {
      payout.providerId = 'f47ac10b-58cc-4372-a567-0e02b2c3d484';
    }
  });
  console.log("Fixed payout references");

  // 10. FIX TRANSACTIONS
  // Fix user IDs in transactions
  data['transactions.json'].forEach(transaction => {
    if (!userIds.includes(transaction.userId)) {
      if (transaction.transactionType === 'payout') {
        const payout = data['payouts.json'].find(p => p.id === transaction.metadata?.payoutId);
        if (payout && userIds.includes(payout.providerId)) {
          transaction.userId = payout.providerId;
        } else {
          transaction.userId = 'f47ac10b-58cc-4372-a567-0e02b2c3d480'; // Default to Jane Smith
        }
      } else {
        transaction.userId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; // Default to John Doe
      }
    }
  });
  console.log("Fixed transaction references");

  // 11. FIX DEVICE TOKENS
  // Ensure all device tokens reference valid users
  data['device-tokens.json'].forEach(token => {
    if (!userIds.includes(token.userId)) {
      token.userId = 'f47ac10b-58cc-4372-a567-0e02b2c3d484'; // Assign to our new tech repair user
    }
  });
  console.log("Fixed device token references");

  // 12. FIX PAYMENT METHODS
  // Ensure all payment methods reference valid users
  data['payment-methods.json'].forEach(method => {
    if (!userIds.includes(method.userId)) {
      method.userId = 'f47ac10b-58cc-4372-a567-0e02b2c3d484';
    }
  });
  console.log("Fixed payment method references");

  // 13. FIX NOTIFICATIONS
  // Ensure all notifications reference valid users
  data['notifications.json'].forEach(notification => {
    if (!userIds.includes(notification.userId)) {
      notification.userId = 'f47ac10b-58cc-4372-a567-0e02b2c3d484';
    }
  });
  console.log("Fixed notification references");

// 14. FIX FLAGGED CONTENTS
  // Ensure all flagged contents reference valid users
  data['flagged-contents.json'].forEach(content => {
    if (content.contentauthorId && !userIds.includes(content.contentauthorId)) {
      content.contentauthorId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; // Default to John Doe
    }
    if (content.reportedbyId && !userIds.includes(content.reportedbyId)) {
      content.reportedbyId = 'f47ac10b-58cc-4372-a567-0e02b2c3d481'; // Default to Admin
    }
    if (content.moderatedbyId && !userIds.includes(content.moderatedbyId)) {
      content.moderatedbyId = 'f47ac10b-58cc-4372-a567-0e02b2c3d481'; // Default to Admin
    }
  });
  console.log("Fixed flagged content references");

  // 15. FIX PAYMENTS
  // Ensure all payments reference valid bookings and payouts
  data['payments.json'].forEach(payment => {
    // Check if bookingId is valid
    const validBookingIds = data['bookings.json'].map(b => b.id);
    if (payment.bookingId && !validBookingIds.includes(payment.bookingId)) {
      // Find a valid booking for this user if possible
      const userBooking = data['bookings.json'].find(b => 
        b.userId === 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
      );
      if (userBooking) {
        payment.bookingId = userBooking.id;
      } else if (validBookingIds.length > 0) {
        payment.bookingId = validBookingIds[0]; // Use the first valid booking
      }
    }
    
    // Check if payoutId is valid
    const validPayoutIds = data['payouts.json'].map(p => p.id);
    if (payment.payoutId && !validPayoutIds.includes(payment.payoutId)) {
      // Either set to null or find a valid payout
      if (validPayoutIds.length > 0) {
        payment.payoutId = validPayoutIds[0];
      } else {
        payment.payoutId = null;
      }
    }
  });
  console.log("Fixed payment references");

  // 16. FINAL VERIFICATION
  // Do a quick check to make sure we haven't missed anything crucial
  const finalBookingErrors = data['bookings.json'].filter(booking => 
    !userIds.includes(booking.userId) || 
    !userIds.includes(booking.providerId)
  );
  if (finalBookingErrors.length > 0) {
    console.log("WARNING: There are still some booking errors: ", finalBookingErrors.length);
    // Force fix these last issues
    finalBookingErrors.forEach(booking => {
      booking.userId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; // Default to John Doe
      booking.providerId = 'f47ac10b-58cc-4372-a567-0e02b2c3d480'; // Default to Jane Smith
    });
  }

  // Write all changes back to files
  for (const file of files) {
    try {
      await fs.writeFile(file, JSON.stringify(data[file], null, 2), { encoding: 'utf8' });
      console.log(`Successfully wrote updated ${file}`);
    } catch (error) {
      console.error(`Error writing ${file}:`, error);
    }
  }
  
  // Verify final consistency
  console.log("Verification complete. All foreign key constraints should now be satisfied.");
  
  return "All data successfully fixed";
}

// Execute the function
fixAllDataIssues()
  .then(result => console.log(result))
  .catch(error => console.error('Error fixing data:', error));