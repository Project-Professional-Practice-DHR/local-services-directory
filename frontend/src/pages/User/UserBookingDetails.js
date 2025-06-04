import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import '../../styles/Profile.css';
import '../../styles/UserBookings.css';

const UserBookingDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [payment, setPayment] = useState(null);
  const [review, setReview] = useState(null);

  // Format date function
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (err) {
      return dateString;
    }
  };

  // Format datetime function
  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return dateString;
    }
  };

  // Format time function
  const formatTime = (timeString) => {
    try {
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

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      'pending': 'status-pending',
      'confirmed': 'status-confirmed',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled',
      'in-progress': 'status-in-progress'
    };
    return statusClasses[status] || 'status-default';
  };

  // Calculate booking duration
  const calculateDuration = (startTime, endTime) => {
    try {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      const diffMs = end - start;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (diffHours > 0) {
        return `${diffHours}h ${diffMinutes}m`;
      } else {
        return `${diffMinutes}m`;
      }
    } catch (err) {
      return 'N/A';
    }
  };

  useEffect(() => {
    const fetchBookingDetails = async () => {
      // First check if booking data was passed through navigation state
      if (location.state?.bookingData) {
        console.log('Using booking data from navigation state:', location.state.bookingData);
        setBooking(location.state.bookingData);
        setLoading(false);
        return;
      }

      // If no state data, fetch from API
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication required. Please log in.');
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching booking details for ID:', id);
        console.log('Token present:', !!token);

        // Try multiple possible API endpoints
        const endpoints = [
          `/api/booking/${id}`,
          `/api/booking/details/${id}`,
          `/api/bookings/${id}`,
          `/api/user/booking/${id}`
        ];

        let response = null;
        let lastError = null;

        for (const endpoint of endpoints) {
          try {
            console.log(`Trying endpoint: ${endpoint}`);
            
            response = await fetch(endpoint, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            console.log(`Response status for ${endpoint}:`, response.status);

            if (response.ok) {
              console.log(`Success with endpoint: ${endpoint}`);
              break;
            } else {
              const errorText = await response.text();
              console.log(`Failed with ${endpoint}:`, errorText);
              lastError = `${endpoint}: ${response.status} ${response.statusText}`;
            }
          } catch (err) {
            console.log(`Network error with ${endpoint}:`, err);
            lastError = `${endpoint}: ${err.message}`;
          }
        }

        if (!response || !response.ok) {
          throw new Error(lastError || 'All booking API endpoints failed');
        }

        const data = await response.json();
        console.log('Booking details response:', data);

        if (data.success) {
          const bookingData = data.data || data.booking;
          setBooking(bookingData);
          
          // Set related data if available
          if (bookingData.messages) setMessages(bookingData.messages);
          if (bookingData.payment) setPayment(bookingData.payment);
          if (bookingData.review) setReview(bookingData.review);
          
        } else if (data.data || data.booking) {
          // Some APIs might not return success flag
          const bookingData = data.data || data.booking;
          setBooking(bookingData);
          
          // Set related data if available
          if (bookingData.messages) setMessages(bookingData.messages);
          if (bookingData.payment) setPayment(bookingData.payment);
          if (bookingData.review) setReview(bookingData.review);
        } else {
          throw new Error(data.message || 'No booking data received');
        }

      } catch (err) {
        console.error('Error fetching booking details:', err);
        setError(`Failed to load booking details: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBookingDetails();
    } else {
      setError('No booking ID provided');
      setLoading(false);
    }
  }, [id, location.state, navigate]);

  // Handle cancel booking
  const handleCancelBooking = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`/api/booking/${booking.id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'User cancelled booking' })
      });

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.success) {
          setBooking({ ...booking, status: 'cancelled', cancellationReason: 'User cancelled booking' });
          alert('Booking cancelled successfully');
        } else {
          throw new Error(responseData.message || 'Failed to cancel booking');
        }
      } else {
        throw new Error('Failed to cancel booking');
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert('Failed to cancel booking. Please try again.');
    }
  };

  // Handle contact provider
  const handleContactProvider = () => {
    if (booking.conversation) {
      navigate(`/conversation/${booking.conversation.id}`);
    } else {
      navigate(`/booking/${booking.id}/messages`);
    }
  };

  if (loading) {
    return (
      <div className="user-profile-page">
        <div className="user-profile-card user-loading-card">
          <div className="user-spinner"></div>
          <p>Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-profile-page">
        <div className="user-profile-card">
          <div className="user-profile-header">
            <span className="user-profile-logo-text">LocalServices</span>
          </div>
          <h1 className="user-profile-title">
            <i className="fas fa-exclamation-triangle user-profile-icon"></i>
            Error
          </h1>
          <div className="user-auth-error">
            {error}
          </div>
          
          {/* DEBUG INFO */}
          <div style={{
            backgroundColor: '#f0f0f0', 
            padding: '15px', 
            margin: '15px 0', 
            fontSize: '12px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}>
            <strong>🐛 DEBUG INFO:</strong><br />
            Booking ID from URL: <code>{id}</code><br />
            Has navigation state: <code>{!!location.state?.bookingData}</code><br />
            Token present: <code>{!!localStorage.getItem('token')}</code>
          </div>
          
          <button 
            onClick={() => navigate('/profile/bookings')}
            className="user-back-home-btn"
          >
            <i className="fas fa-arrow-left"></i> Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="user-profile-page">
        <div className="user-profile-card">
          <div className="user-profile-header">
            <span className="user-profile-logo-text">LocalServices</span>
          </div>
          <h1 className="user-profile-title">
            <i className="fas fa-calendar-times user-profile-icon"></i>
            Booking Not Found
          </h1>
          <p>The requested booking could not be found.</p>
          <button 
            onClick={() => navigate('/profile/bookings')}
            className="user-back-home-btn"
          >
            <i className="fas fa-arrow-left"></i> Back to Bookings
          </button>
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
          Booking Details
        </h1>

        <div className="user-profile-content">
          {/* Main Booking Card */}
          <div className="user-booking-card">
            <div className="user-booking-header">
              <div>
                <h2>{booking.service?.name || booking.serviceName || 'Service Booking'}</h2>
                {booking.service?.description && (
                  <p className="service-description">{booking.service.description}</p>
                )}
              </div>
              <span className={`user-booking-status ${getStatusBadgeClass(booking.status)}`}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
            </div>

            <div className="user-booking-details">
              {/* Booking Reference */}
              {booking.bookingReference && (
                <div className="booking-reference-highlight">
                  <i className="fas fa-ticket-alt"></i> 
                  <strong>Reference: {booking.bookingReference}</strong>
                </div>
              )}

              {/* Service & Provider Information */}
              <div className="booking-section">
                <h3><i className="fas fa-info-circle"></i> Service Information</h3>
                
                {booking.provider && (
                  <p><i className="fas fa-user-tie"></i> <strong>Provider:</strong> {booking.provider.name || booking.provider.businessName}</p>
                )}
                
                {booking.service?.category && (
                  <p><i className="fas fa-tag"></i> <strong>Category:</strong> {booking.service.category}</p>
                )}
                
                {booking.price && (
                  <p><i className="fas fa-dollar-sign"></i> <strong>Price:</strong> ${parseFloat(booking.price).toFixed(2)}</p>
                )}
              </div>

              {/* Date & Time Information */}
              <div className="booking-section">
                <h3><i className="fas fa-calendar-alt"></i> Schedule</h3>
                <p><i className="fas fa-calendar"></i> <strong>Date:</strong> {formatDate(booking.bookingDate)}</p>
                <p><i className="fas fa-clock"></i> <strong>Time:</strong> {formatTime(booking.startTime)} - {formatTime(booking.endTime)}</p>
                <p><i className="fas fa-hourglass-half"></i> <strong>Duration:</strong> {calculateDuration(booking.startTime, booking.endTime)}</p>
              </div>

              {/* Customer Information */}
              <div className="booking-section">
                <h3><i className="fas fa-user"></i> Customer Details</h3>
                
                {booking.customer && (
                  <>
                    <p><i className="fas fa-user-circle"></i> <strong>Name:</strong> {booking.customer.firstName} {booking.customer.lastName}</p>
                    <p><i className="fas fa-envelope"></i> <strong>Email:</strong> {booking.customer.email}</p>
                    {booking.customer.phone && (
                      <p><i className="fas fa-phone"></i> <strong>Phone:</strong> {booking.customer.phone}</p>
                    )}
                  </>
                )}
                
                {!booking.customer && (
                  <>
                    {booking.customerName && (
                      <p><i className="fas fa-user-circle"></i> <strong>Name:</strong> {booking.customerName}</p>
                    )}
                    {booking.customerEmail && (
                      <p><i className="fas fa-envelope"></i> <strong>Email:</strong> {booking.customerEmail}</p>
                    )}
                    {booking.customerPhone && (
                      <p><i className="fas fa-phone"></i> <strong>Phone:</strong> {booking.customerPhone}</p>
                    )}
                  </>
                )}

                {booking.address && (
                  <p><i className="fas fa-map-marker-alt"></i> <strong>Address:</strong> {booking.address}</p>
                )}
              </div>

              {/* Additional Information */}
              {(booking.notes || booking.cancellationReason) && (
                <div className="booking-section">
                  <h3><i className="fas fa-sticky-note"></i> Additional Information</h3>
                  
                  {booking.notes && (
                    <p><i className="fas fa-comment"></i> <strong>Notes:</strong> {booking.notes}</p>
                  )}
                  
                  {booking.cancellationReason && (
                    <p><i className="fas fa-times-circle"></i> <strong>Cancellation Reason:</strong> {booking.cancellationReason}</p>
                  )}
                </div>
              )}

              {/* Payment Information */}
              {payment && (
                <div className="booking-section">
                  <h3><i className="fas fa-credit-card"></i> Payment Information</h3>
                  <p><i className="fas fa-money-check"></i> <strong>Status:</strong> {payment.status}</p>
                  <p><i className="fas fa-dollar-sign"></i> <strong>Amount:</strong> ${parseFloat(payment.amount).toFixed(2)}</p>
                  {payment.paymentMethod && (
                    <p><i className="fas fa-credit-card"></i> <strong>Method:</strong> {payment.paymentMethod}</p>
                  )}
                  {payment.transactionId && (
                    <p><i className="fas fa-receipt"></i> <strong>Transaction ID:</strong> {payment.transactionId}</p>
                  )}
                </div>
              )}

              {/* Review Information */}
              {review && (
                <div className="booking-section">
                  <h3><i className="fas fa-star"></i> Review</h3>
                  <p><i className="fas fa-star"></i> <strong>Rating:</strong> {review.rating}/5</p>
                  {review.comment && (
                    <p><i className="fas fa-comment"></i> <strong>Comment:</strong> {review.comment}</p>
                  )}
                  <p><i className="fas fa-calendar"></i> <strong>Date:</strong> {formatDateTime(review.createdAt)}</p>
                </div>
              )}

              {/* Messages Preview */}
              {messages && messages.length > 0 && (
                <div className="booking-section">
                  <h3><i className="fas fa-comments"></i> Recent Messages ({messages.length})</h3>
                  <div className="messages-preview">
                    {messages.slice(-2).map((message, index) => (
                      <div key={index} className="message-preview">
                        <strong>{message.senderName}:</strong> {message.content.substring(0, 100)}
                        {message.content.length > 100 && '...'}
                        <small> - {formatDateTime(message.createdAt)}</small>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Booking Timeline */}
              <div className="booking-section">
                <h3><i className="fas fa-history"></i> Booking Timeline</h3>
                <div className="booking-timeline">
                  <p><i className="fas fa-plus-circle"></i> <strong>Created:</strong> {formatDateTime(booking.createdAt)}</p>
                  {booking.updatedAt && booking.updatedAt !== booking.createdAt && (
                    <p><i className="fas fa-edit"></i> <strong>Last Updated:</strong> {formatDateTime(booking.updatedAt)}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="user-booking-actions">
              {(booking.status === 'confirmed' || booking.status === 'pending') && (
                <button 
                  className="user-cancel-booking-btn"
                  onClick={handleCancelBooking}
                >
                  <i className="fas fa-times"></i> Cancel Booking
                </button>
              )}
              
              {booking.status === 'completed' && !review && (
                <button 
                  onClick={() => navigate(`/booking/${booking.id}/review`)}
                  className="user-add-review-btn"
                >
                  <i className="fas fa-star"></i> Leave Review
                </button>
              )}

              {booking.provider && (
                <button 
                  onClick={handleContactProvider}
                  className="user-contact-provider-btn"
                >
                  <i className="fas fa-comments"></i> Contact Provider
                </button>
              )}

              {payment && payment.status === 'pending' && (
                <button 
                  onClick={() => navigate(`/booking/${booking.id}/payment`)}
                  className="user-pay-now-btn"
                >
                  <i className="fas fa-credit-card"></i> Pay Now
                </button>
              )}
            </div>
          </div>
        </div>

        <button 
          onClick={() => navigate('/profile/bookings')}
          className="user-back-home-btn"
        >
          <i className="fas fa-arrow-left"></i> Back to Bookings
        </button>
      </div>
    </div>
  );
};

export default UserBookingDetails;