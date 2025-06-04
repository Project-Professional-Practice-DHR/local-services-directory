import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/Profile.css';
import '../../styles/UserBookings.css';

const UserBookings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookings, setBookings] = useState([]);
  
  const navigate = useNavigate();
  
  // Format date function
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (err) {
      return dateString;
    }
  };
  
  // Format time function for better display
  const formatTime = (timeString) => {
    try {
      // Handle both HH:mm:ss and HH:mm formats
      const time = timeString.split(':');
      const hours = parseInt(time[0]);
      const minutes = time[1];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes} ${ampm}`;
    } catch (err) {
      return timeString;
    }
  };
  
  // Using useCallback to memoize the fetchBookings function
  const fetchBookings = useCallback(async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Log the token being used (masked for security)
      const maskedToken = token.substring(0, 10) + '...' + token.substring(token.length - 5);
      console.log("Using token:", maskedToken);
      
      // First try with the main endpoint
      const bookingsResponse = await fetch('/api/booking/my-bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Log the response status
      console.log("API Response Status:", bookingsResponse.status);
      
      if (!bookingsResponse.ok) {
        // For debugging purposes, try to get the full error response
        try {
          const errorText = await bookingsResponse.text();
          console.error("Error response:", errorText);
        } catch (e) {
          console.error("Could not get error text:", e);
        }
        
        throw new Error(`Failed to fetch bookings: ${bookingsResponse.status} ${bookingsResponse.statusText}`);
      }
      
      const data = await bookingsResponse.json();
      console.log("API Response Data:", data);
      
      if (data.success) {
        if (Array.isArray(data.data)) {
          console.log("Bookings fetched successfully:", data.data);
          setBookings(data.data);
        } else {
          console.error("API returned success but data is not an array:", data.data);
          setBookings([]);
        }
      } else {
        console.error("API returned error:", data);
        throw new Error(data.message || 'Invalid data format received from API');
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings. Please try again.');
      
      // Log any network errors
      if (err.name === 'TypeError') {
        console.error("Network error:", err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);
  
  useEffect(() => {
    console.log("UserBookings component mounted, fetching data...");
    fetchBookings();
  }, [fetchBookings]);
  
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }
    
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      console.log(`Attempting to cancel booking: ${bookingId}`);
      
      // Updated to use the correct cancel endpoint from your API
      const response = await fetch(`/api/userbooking/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'User cancelled booking' })
      });
      
      console.log("Cancel API Response Status:", response.status);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log("Cancel API Response Data:", responseData);
        
        if (responseData.success) {
          // Update the booking status in the local state
          setBookings(bookings.map(booking => 
            booking.id === bookingId ? { ...booking, status: 'cancelled', cancellationReason: 'User cancelled booking' } : booking
          ));
          console.log("Booking cancelled successfully");
        } else {
          throw new Error(responseData.message || 'Failed to cancel booking');
        }
      } else {
        // Try to get error details
        const errorText = await response.text();
        console.error("Error cancelling booking:", errorText);
        throw new Error('Failed to cancel booking');
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setError('Failed to cancel booking. Please try again.');
      
      // Clear error after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };
  
  // Filter bookings by status for better organization
  const upcomingBookings = bookings.filter(booking => 
    booking.status === 'confirmed' || booking.status === 'pending' || 
    booking.status === 'in_progress' || booking.status === 'rescheduled'
  );
  
  const pastBookings = bookings.filter(booking => 
    booking.status === 'completed' || booking.status === 'cancelled' || booking.status === 'rejected'
  );
  
  console.log("Upcoming bookings:", upcomingBookings.length);
  console.log("Past bookings:", pastBookings.length);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="user-profile-page">
        <div className="user-profile-card user-loading-card">
          <div className="user-spinner"></div>
          <p>Loading bookings...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="user-profile-page">
      <div className="user-profile-card">
        <div className="user-profile-header">
          <span className="user-profile-logo-text">LocalServices</span>
        </div>
        <h1 className="user-profile-title">
          <i className="fas fa-calendar-check user-profile-icon"></i>
          My Bookings
        </h1>
        
        <div className="user-profile-navigation">
          <Link to="/profile" className="user-nav-link">
            <i className="fas fa-user-circle"></i> Profile
          </Link>
          <Link to="/profile/userbookings" className="user-nav-link active">
            <i className="fas fa-calendar-check"></i> Bookings
          </Link>
          <Link to="/profile/reviews" className="user-nav-link">
            <i className="fas fa-star"></i> Reviews
          </Link>
        </div>
        
        {error && (
          <div className="user-auth-error">
            {error}
          </div>
        )}
        
        <div className="user-profile-content">
          <div className="user-bookings-section">
            {/* Upcoming Bookings Section */}
            <div className="user-bookings-category">
              <h2>Upcoming Bookings</h2>
              {upcomingBookings.length > 0 ? (
                <div className="user-bookings-list">
                  {upcomingBookings.map((booking) => (
                    <div className="user-booking-card" key={booking.id}>
                      <div className="user-booking-header">
                        <h3>{booking.service?.name || booking.serviceName || 'Service Booking'}</h3>
                        <span className={`user-booking-status ${booking.status}`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="user-booking-details">
                        {/* Booking Reference - prominently displayed */}
                        {booking.bookingReference && (
                          <p className="booking-reference-highlight">
                            <i className="fas fa-ticket-alt"></i> 
                            <strong>Ref: {booking.bookingReference}</strong>
                          </p>
                        )}
                        <p><i className="fas fa-calendar"></i> <strong>Date:</strong> {formatDate(booking.bookingDate)}</p>
                        <p><i className="fas fa-clock"></i> <strong>Time:</strong> {formatTime(booking.startTime)} - {formatTime(booking.endTime)}</p>
                        {booking.price && (
                          <p><i className="fas fa-tag"></i> Price: ${parseFloat(booking.price).toFixed(2)}</p>
                        )}
                      </div>
                      <div className="user-booking-actions">
                        <Link to={`/userbooking/${booking.id}`} className="user-view-booking-details-btn">
                          View Details
                        </Link>
                        {(booking.status === 'confirmed' || booking.status === 'pending') && (
                          <button 
                            className="user-cancel-booking-btn"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            Cancel Booking
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="user-empty-section">
                  <i className="fas fa-calendar-times user-empty-icon"></i>
                  <p>You don't have any upcoming bookings.</p>
                  <Link to="/services" className="user-browse-services-btn">
                    Browse Services
                  </Link>
                </div>
              )}
            </div>
            
            {/* Past Bookings Section */}
            <div className="user-bookings-category">
              <h2>Past Bookings</h2>
              {pastBookings.length > 0 ? (
                <div className="user-bookings-list">
                  {pastBookings.map((booking) => (
                    <div className="user-booking-card user-past-booking" key={booking.id}>
                      <div className="user-booking-header">
                        <h3>{booking.service?.name || booking.serviceName || 'Service Booking'}</h3>
                        <span className={`user-booking-status ${booking.status}`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="user-booking-details">
                        {/* Booking Reference - prominently displayed */}
                        {booking.bookingReference && (
                          <p className="booking-reference-highlight">
                            <i className="fas fa-ticket-alt"></i> 
                            <strong>Ref: {booking.bookingReference}</strong>
                          </p>
                        )}
                        <p><i className="fas fa-calendar"></i> <strong>Date:</strong> {formatDate(booking.bookingDate)}</p>
                        <p><i className="fas fa-clock"></i> <strong>Time:</strong> {formatTime(booking.startTime)} - {formatTime(booking.endTime)}</p>
                        {booking.cancellationReason && (
                          <p><i className="fas fa-comment-alt"></i> Reason: {booking.cancellationReason}</p>
                        )}
                      </div>
                      <div className="user-booking-actions">
                        <Link to={`/booking/${booking.id}`} className="user-view-booking-details-btn">
                          View Details
                        </Link>
                        {booking.status === 'completed' && !booking.isReviewed && (
                          <Link to={`/booking/${booking.id}/review`} className="user-add-review-btn">
                            Leave Review
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="user-empty-section">
                  <i className="fas fa-history user-empty-icon"></i>
                  <p>You don't have any past bookings.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <Link to="/" className="user-back-home-btn">
          <i className="fas fa-arrow-left"></i> Back to Home
        </Link>
      </div>
    </div>
  );
};

export default UserBookings;