// Save this file in your project root and run with Node.js
// node test-booking-api.js
const axios = require('axios');

const API_URL = 'http://localhost:5001'; // Change to your server URL
const testToken = 'demo-token'; // Use a valid token if you have one

async function testBookingAPI() {
  console.log('🔍 Testing Booking API endpoints...');
  
  try {
    // Test creating a booking
    console.log('\n📝 Testing POST /api/booking');
    const createData = {
      serviceId: '12345', // Use a valid service ID if you have one
      date: new Date().toISOString().split('T')[0],
      time: '09:00-10:00',
      notes: 'Test booking from API test script',
      status: 'confirmed'
    };
    
    try {
      const createResponse = await axios.post(`${API_URL}/api/booking`, createData, {
        headers: {
          Authorization: `Bearer ${testToken}`
        }
      });
      
      console.log('✅ Create booking successful!');
      console.log('Response:', createResponse.data);
      
      // Save booking ID for further tests
      const bookingId = createResponse.data.data?.id || '12345';
      
      // Test getting a booking
      console.log('\n📝 Testing GET /api/booking/:id');
      try {
        const getResponse = await axios.get(`${API_URL}/api/booking/${bookingId}`, {
          headers: {
            Authorization: `Bearer ${testToken}`
          }
        });
        
        console.log('✅ Get booking successful!');
        console.log('Response:', getResponse.data);
      } catch (getError) {
        console.error('❌ Get booking failed!');
        console.error('Error:', getError.response?.data || getError.message);
      }
      
      // Test updating a booking
      console.log('\n📝 Testing PUT /api/booking/:id');
      const updateData = {
        status: 'confirmed',
        notes: 'Updated test booking'
      };
      
      try {
        const updateResponse = await axios.put(`${API_URL}/api/booking/${bookingId}`, updateData, {
          headers: {
            Authorization: `Bearer ${testToken}`
          }
        });
        
        console.log('✅ Update booking successful!');
        console.log('Response:', updateResponse.data);
      } catch (updateError) {
        console.error('❌ Update booking failed!');
        console.error('Error:', updateError.response?.data || updateError.message);
      }
      
      // Test getting user bookings
      console.log('\n📝 Testing GET /api/booking/my-bookings');
      try {
        const myBookingsResponse = await axios.get(`${API_URL}/api/booking/my-bookings`, {
          headers: {
            Authorization: `Bearer ${testToken}`
          }
        });
        
        console.log('✅ Get my bookings successful!');
        console.log('Response:', myBookingsResponse.data);
      } catch (myBookingsError) {
        console.error('❌ Get my bookings failed!');
        console.error('Error:', myBookingsError.response?.data || myBookingsError.message);
      }
      
      // Test getting all bookings (admin only)
      console.log('\n📝 Testing GET /api/booking (admin)');
      try {
        const allBookingsResponse = await axios.get(`${API_URL}/api/booking`, {
          headers: {
            Authorization: `Bearer ${testToken}`
          }
        });
        
        console.log('✅ Get all bookings successful!');
        console.log('Response:', allBookingsResponse.data);
      } catch (allBookingsError) {
        console.error('❌ Get all bookings failed!');
        console.error('Error:', allBookingsError.response?.data || allBookingsError.message);
      }
      
    } catch (createError) {
      console.error('❌ Create booking failed!');
      console.error('Error:', createError.response?.data || createError.message);
    }
    
  } catch (error) {
    console.error('❌ Tests failed with an unexpected error:');
    console.error(error);
  }
}

// Run the tests
testBookingAPI().then(() => {
  console.log('\n🏁 API tests completed!');
});