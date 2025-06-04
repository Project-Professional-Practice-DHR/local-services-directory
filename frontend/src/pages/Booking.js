import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ServicesData from '../mock/Services.json';
import { v4 as uuidv4 } from 'uuid';
import '../styles/Booking.css';

const Booking = () => {
  // Get serviceId from URL parameters
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [setSuccessMessage] = useState('');
  
  // Form state
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState(1); // Default duration: 1 hour
  const [notes, setNotes] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingReference, setBookingReference] = useState('');
  
  // Review state - adding review functionality
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [previousBookings, setPreviousBookings] = useState([]);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);
  
  // Availability state
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  
  // Customer information
  const [customer, setCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  
  // Address state
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: 'England', // Default state/county
    postalCode: '',
    country: 'United Kingdom' // Default country
  });
  
  // Available starting times
  const [availableStartTimes, setAvailableStartTimes] = useState([
    { time: '09:00', available: true },
    { time: '10:00', available: true },
    { time: '11:00', available: true },
    { time: '12:00', available: true },
    { time: '13:00', available: true },
    { time: '14:00', available: true },
    { time: '15:00', available: true },
    { time: '16:00', available: true },
    { time: '17:00', available: true }
  ]);
  
  // Get today's date for min date attribute
  const today = new Date().toISOString().split('T')[0];
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Calculate total price
  const calculateTotalPrice = () => {
    if (!service) return 0;
    
    // Extract numeric price from price string (e.g., "£25 per hour" -> 25)
    const priceMatch = service.price?.match(/\d+/) || service.priceRange?.match(/\d+/);
    const hourlyRate = priceMatch ? parseInt(priceMatch[0]) : 25; // Default to 25 if not found
    return hourlyRate * duration;
  };
  
  // Get service data and fetch previous bookings for review option
  useEffect(() => {
    console.log('Booking component mounted. Service ID:', id);
    
    // Scroll to top
    window.scrollTo(0, 0);
    
    // Fetch service details
    setLoading(true);
    
    // Using mock data for demo
    setTimeout(() => {
      try {
        const foundService = ServicesData.services.find(s => s.id.toString() === id);
        
        if (foundService) {
          setService(foundService);
          setError(null);
        } else {
          setError('Service not found');
        }
      } catch (err) {
        setError('Error loading service details');
      } finally {
        setLoading(false);
      }
    }, 300);
    
    // Fetch previous bookings for review option (if logged in)
    const fetchPreviousBookings = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          return; // Not logged in, don't fetch
        }
        
        const response = await axios.get('/api/booking/my-bookings?status=completed', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.success && response.data.data) {
          // Filter for completed bookings that don't have reviews yet
          const completedBookings = response.data.data.filter(
            booking => booking.status === 'completed' && !booking.review
          );
          
          setPreviousBookings(completedBookings);
          
          // If there are completed bookings without reviews, show option to review
          if (completedBookings.length > 0) {
            // Check if any of the completed bookings are for this service
            const serviceBookings = completedBookings.filter(
              booking => booking.serviceId === id || booking.service?.id === id
            );
            
            if (serviceBookings.length > 0) {
              setShowReviewForm(true);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching previous bookings:', err);
      }
    };
    
    fetchPreviousBookings();
  }, [id]);
  
  // Enhanced availability check function
  const checkAvailability = async () => {
    if (!bookingDate) {
      setFormErrors(prev => ({...prev, date: 'Please select a date first'}));
      return;
    }
    
    setIsCheckingAvailability(true);
    setAvailabilityChecked(false);
    
    try {
      // In a real application, you would call your API here
      // For demonstration purposes, we're simulating an API call with setTimeout
      // In production, replace with a real API call:
      // const response = await axios.get(`/api/bookings/availability/${id}/${bookingDate}`);
      
      // Simulating API call
      const mockApiCall = new Promise((resolve) => {
        setTimeout(() => {
          // Generate some random availability for demo purposes
          const updatedTimes = availableStartTimes.map(time => {
            // Randomly make some time slots unavailable (30% chance)
            const isAvailable = Math.random() > 0.3;
            return { ...time, available: isAvailable };
          });
          resolve(updatedTimes);
        }, 1000); // Simulate a 1-second API delay
      });
      
      const updatedAvailability = await mockApiCall;
      setAvailableStartTimes(updatedAvailability);
      setAvailabilityChecked(true);
      
      // Clear any previously selected time if it's now unavailable
      if (startTime) {
        const selectedTimeObj = updatedAvailability.find(t => t.time === startTime);
        if (selectedTimeObj && !selectedTimeObj.available) {
          setStartTime('');
          setEndTime('');
          setFormErrors(prev => ({...prev, timeSlot: 'Your previously selected time is no longer available. Please select a new time.'}));
        }
      }
      
      // Check if any time slots are available
      const anyAvailable = updatedAvailability.some(time => time.available);
      if (!anyAvailable) {
        setFormErrors(prev => ({...prev, timeSlot: 'No time slots available for the selected date. Please choose another date.'}));
      } else {
        setFormErrors(prev => {
          const newErrors = {...prev};
          delete newErrors.timeSlot;
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      setFormErrors(prev => ({...prev, timeSlot: 'Error checking availability. Please try again.'}));
    } finally {
      setIsCheckingAvailability(false);
    }
  };
  
  // Auto-check availability when date changes
  useEffect(() => {
    if (bookingDate) {
      // Reset time selection when date changes
      setStartTime('');
      setEndTime('');
      setAvailabilityChecked(false);
      
      // Don't auto-check here, let the user press the check availability button
    }
  }, [bookingDate]);
  
  // Handle time selection
  const handleTimeSelect = (time) => {
    setStartTime(time);
    
    // Calculate end time based on duration
    const startHour = parseInt(time.split(':')[0]);
    const endHour = startHour + duration;
    
    // Format end time with leading zero if needed
    const endTime = `${endHour.toString().padStart(2, '0')}:00`;
    setEndTime(endTime);
    
    setFormErrors({...formErrors, timeSlot: ''});
  };
  
  // Handle customer information change
  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomer(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear customer error if field is filled
    if (value && formErrors.customer) {
      setFormErrors(prev => ({
        ...prev,
        customer: prev.customer?.filter(field => field !== name) || []
      }));
    }
  };
  
  // Handle address change
  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddress(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear address error if field is filled
    if (value && formErrors.address) {
      setFormErrors(prev => ({
        ...prev,
        address: prev.address?.filter(field => field !== name) || []
      }));
    }
  };
  
  // Handle duration change
  const handleDurationChange = (e) => {
    const value = parseInt(e.target.value);
    setDuration(value);
    
    // Recalculate end time if start time is selected
    if (startTime) {
      const startHour = parseInt(startTime.split(':')[0]);
      const endHour = startHour + value;
      
      // Format end time with leading zero if needed
      const updatedEndTime = `${endHour.toString().padStart(2, '0')}:00`;
      setEndTime(updatedEndTime);
    }
  };
  
  // Review handlers
  const handleRatingChange = (rating) => {
    setReviewRating(rating);
  };
  
  const handleReviewCommentChange = (e) => {
    setReviewComment(e.target.value);
  };
  
  const handleBookingSelect = (bookingId) => {
    const selected = previousBookings.find(booking => booking.id === bookingId);
    setSelectedBookingForReview(selected);
  };
  
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!selectedBookingForReview || !reviewComment) {
      setFormErrors({
        ...formErrors,
        review: !selectedBookingForReview 
          ? 'Please select a booking to review' 
          : 'Please provide review comments'
      });
      return;
    }
    
    setIsSubmittingReview(true);
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      // Create review data
      const reviewData = {
        bookingId: selectedBookingForReview.id,
        serviceId: selectedBookingForReview.serviceId || id,
        rating: reviewRating,
        comment: reviewComment
      };
      
      console.log('Submitting review:', reviewData);
      
      // Make API call to submit review
      const response = await axios.post('/api/reviews', reviewData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Review response:', response.data);
      
      if (response.status === 201 || response.status === 200) {
        setReviewSuccess(true);
        setSuccessMessage('Thank you! Your review has been submitted successfully.');
        
        // Clear form
        setReviewComment('');
        setReviewRating(5);
        setSelectedBookingForReview(null);
        
        // Remove the reviewed booking from the list
        setPreviousBookings(prevBookings => 
          prevBookings.filter(booking => booking.id !== selectedBookingForReview.id)
        );
        
        // If no more bookings left to review, hide the form
        if (previousBookings.length <= 1) {
          setShowReviewForm(false);
        }
        
        // Show success message temporarily
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setFormErrors({
        ...formErrors,
        review: err.response?.data?.message || 'Failed to submit review. Please try again.'
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };
  
  // Validate form
  const validateForm = () => {
    const errors = {};
    
    // Validate booking date and time
    if (!bookingDate) {
      errors.date = 'Please select a date';
    }
    
    if (!startTime || !endTime) {
      errors.timeSlot = 'Please select a time slot';
    }
    
    if (!availabilityChecked) {
      errors.availability = 'Please check availability before confirming your booking';
    }
    
    // Validate customer information
    const customerErrors = [];
    if (!customer.firstName) customerErrors.push('firstName');
    if (!customer.lastName) customerErrors.push('lastName');
    if (!customer.email) customerErrors.push('email');
    else if (!/\S+@\S+\.\S+/.test(customer.email)) customerErrors.push('email');
    if (!customer.phone) customerErrors.push('phone');
    
    if (customerErrors.length > 0) {
      errors.customer = customerErrors;
    }
    
    // Validate address
    const addressErrors = [];
    if (!address.street) addressErrors.push('street');
    if (!address.city) addressErrors.push('city');
    if (!address.postalCode) addressErrors.push('postalCode');
    
    if (addressErrors.length > 0) {
      errors.address = addressErrors;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Format address for display
  const formatAddress = () => {
    const { street, city, state, postalCode, country } = address;
    return `${street}, ${city}, ${state} ${postalCode}, ${country}`;
  };
  
  // Format customer name for display
  const formatCustomerName = () => {
    return `${customer.firstName} ${customer.lastName}`;
  };

 

// Submit booking to API
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validate form first
  if (!validateForm()) {
    const firstErrorElement = document.querySelector('.error, .error-message');
    if (firstErrorElement) {
      firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }
  
  // Set submission state
  setIsSubmitting(true);
  
  try {
    const token = localStorage.getItem('token');
    const loggedInUserId = localStorage.getItem('userId');
    
    // Use the actual service ID from the URL parameter (id) instead of generating a new UUID
    // This is the key fix - using the real service ID instead of a random UUID
    const serviceId = id;
    
    // Create location string from address
    const locationString = formatAddress();
    
    // Create the booking payload
    const bookingPayload = {
      serviceId: serviceId, // Using the correct service ID
      userId: parseInt(loggedInUserId),
      date: bookingDate,
      time: `${startTime}-${endTime}`,
      duration: duration,
      price: calculateTotalPrice(),
      notes: notes,
      status: 'confirmed',
      location: locationString,
      customer: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone
      }
    };
    
    console.log('Sending booking data:', bookingPayload);
    
    // Send POST request to booking API
    const response = await axios.post('/api/booking', bookingPayload, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Booking response:', response.data);
    
    // Set booking reference from response or generate fallback
    setBookingReference(response.data.reference || `BK-${Math.floor(10000 + Math.random() * 90000)}`);
    setBookingSuccess(true);
    
    // Store booking info in session storage for potential use in other components
    sessionStorage.setItem('pendingBookingRef', bookingReference);
    sessionStorage.setItem('pendingBookingAmount', calculateTotalPrice());
    sessionStorage.setItem('pendingBookingService', service.name);
  } catch (err) {
    console.error('Booking error:', err);
    setError('Booking failed. Please try again.');
    setFormErrors(prev => ({
      ...prev,
      general: err.message || 'An unexpected error occurred. Please try again.'
    }));
  } finally {
    setIsSubmitting(false);
  }
};
  
  // Return to services
  const handleBookAnother = () => {
    navigate('/services');
  };
  
  // Go to booking details
  const handleViewBooking = () => {
    navigate('/booking/my-bookings,');
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="booking-page-wrapper">
        <div className="booking-loading">
          <div className="loading-spinner"></div>
          <p>Loading booking information...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error || !service) {
    return (
      <div className="booking-page-wrapper">
        <div className="booking-error">
          <h2>{error || 'Service not found'}</h2>
          <button className="back-to-services-btn" onClick={() => navigate('/services')}>
            Back to Services
          </button>
        </div>
      </div>
    );
  }
  
  // After a successful booking creation
  if (bookingSuccess) {
    return (
      <div className="booking-page-wrapper">
        <div className="booking-success">
          <div className="success-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h2>Booking Created Successfully!</h2>
          <p>Your booking for <strong>{service.name}</strong> has been created. Please complete payment to confirm your booking.</p>
          <div className="booking-details">
            <div className="booking-detail-item">
              <span className="detail-label">Booking Reference:</span>
              <span className="detail-value">{bookingReference}</span>
            </div>
            <div className="booking-detail-item">
              <span className="detail-label">Service:</span>
              <span className="detail-value">{service.name}</span>
            </div>
            <div className="booking-detail-item">
              <span className="detail-label">Customer:</span>
              <span className="detail-value">{formatCustomerName()}</span>
            </div>
            <div className="booking-detail-item">
              <span className="detail-label">Date:</span>
              <span className="detail-value">{formatDate(bookingDate)}</span>
            </div>
            <div className="booking-detail-item">
              <span className="detail-label">Time:</span>
              <span className="detail-value">{startTime} - {endTime}</span>
            </div>
            <div className="booking-detail-item">
              <span className="detail-label">Duration:</span>
              <span className="detail-value">{duration} hour{duration > 1 ? 's' : ''}</span>
            </div>
            <div className="booking-detail-item">
              <span className="detail-label">Service Location:</span>
              <span className="detail-value">{formatAddress()}</span>
            </div>
            <div className="booking-detail-item">
              <span className="detail-label">Total Amount:</span>
              <span className="detail-value">£{calculateTotalPrice()}</span>
            </div>
            <div className="booking-detail-item">
              <span className="detail-label">Status:</span>
              <span className="detail-value booking-status-pending">Pending Payment</span>
            </div>
          </div>
          <div className="on-location-notification">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div>
              <p>Our service provider will travel to your location at the scheduled time once payment is confirmed.</p>
              <p>You will receive a confirmation email with all booking details after payment. We'll also send you a reminder 24 hours before your appointment.</p>
            </div>
          </div>
          <div className="booking-success-actions">
            <button className="proceed-to-payment-btn" onClick={() => navigate(`/payment/${bookingReference}`)}>
              Proceed to Payment
            </button>
            <button className="view-booking-btn" onClick={handleViewBooking}>
              View Booking Details
            </button>
            <button className="book-another-btn" onClick={handleBookAnother}>
              Book Another Service
            </button>                
          </div>
        </div>
      </div>
    );
  }
  
  // Booking form
  return (
    <div className="booking-page-wrapper">
      <div className="booking-header">
        <div className="booking-header-content">
          <h1>Book Your Appointment</h1>
          <div className="booking-service-info">
            <div className="service-image">
              <img 
                src={service.image} 
                alt={service.name}
                onError={(e) => {
                  e.target.src = '/default-service-image.png';
                }}
              />
            </div>
            <div className="service-details">
              <h2>{service.name}</h2>
              <div className="service-meta">
                <span className="service-category">{service.category}</span>
                <span className="service-price">{service.price || service.priceRange}</span>
                <div className="service-rating">
                  <span className="stars">★ {service.rating?.toFixed(1)}</span>
                  <span className="review-count">({service.reviewCount || 0} reviews)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add the review section at the top if the user has previous completed bookings */}
      {showReviewForm && (
        <div className="review-section">
          <div className="review-container">
            <h2>Leave a Review for {service.name}</h2>
            {reviewSuccess ? (
              <div className="review-success">
                <div className="success-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <p>Thank you for your review! Your feedback helps other customers make informed decisions.</p>
              </div>
            ) : (
              <form className="review-form" onSubmit={handleSubmitReview}>
                {previousBookings.length > 0 && (
                  <div className="form-group">
                    <label htmlFor="bookingSelect">Select a previous booking to review:</label>
                    <select 
                      id="bookingSelect" 
                      value={selectedBookingForReview?.id || ''}
                      onChange={(e) => handleBookingSelect(e.target.value)}
                      className={formErrors.review && !selectedBookingForReview ? 'error' : ''}
                    >
                      <option value="">-- Select a booking --</option>
                      {previousBookings.map(booking => (
                        <option key={booking.id} value={booking.id}>
                          {formatDate(booking.date || booking.bookingDate)} - {booking.service?.name || service.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="form-group">
                  <label>Rating:</label>
                  <div className="rating-select">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <div 
                        key={rating} 
                        className={`rating-star ${reviewRating >= rating ? 'selected' : ''}`}
                        onClick={() => handleRatingChange(rating)}
                      >
                        ★
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="reviewComment">Your Review:</label>
                  <textarea
                    id="reviewComment"
                    value={reviewComment}
                    onChange={handleReviewCommentChange}
                    placeholder="Share your experience with this service..."
                    rows="4"
                    className={formErrors.review && !reviewComment ? 'error' : ''}
                  ></textarea>
                </div>
                
                {formErrors.review && (
                  <div className="error-message">{formErrors.review}</div>
                )}
                
                <div className="review-form-actions">
                  <button
                    type="submit"
                    className="submit-review-btn"
                    disabled={isSubmittingReview}
                  >
                    {isSubmittingReview ? (
                      <>
                        <span className="spinner-small"></span>
                        Submitting...
                      </>
                    ) : (
                      'Submit Review'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      
      <div className="booking-content">
        <div className="booking-form-container">
          <form className="booking-form" onSubmit={handleSubmit}>
            {/* Date Selection */}
            <div className="booking-form-section">
              <h3>Select Date</h3>
              <div className="date-selector">
                <input 
                  type="date" 
                  value={bookingDate}
                  min={today}
                  onChange={(e) => {
                    setBookingDate(e.target.value);
                    setFormErrors({...formErrors, date: ''});
                    // Reset availability check when date changes
                    setAvailabilityChecked(false);
                  }}
                  className={formErrors.date ? 'error' : ''}
                />
                
                {/* Check Availability Button */}
                <button 
                  type="button" 
                  className="check-availability-btn"
                  disabled={!bookingDate || isCheckingAvailability}
                  onClick={checkAvailability}
                >
                  {isCheckingAvailability ? (
                    <>
                      <span className="spinner-small"></span>
                      Checking...
                    </>
                  ) : availabilityChecked ? (
                    'Refresh Availability'
                  ) : (
                    'Check Availability'
                  )}
                </button>
              </div>
              {formErrors.date && <div className="error-message">{formErrors.date}</div>}
              {formErrors.availability && <div className="error-message">{formErrors.availability}</div>}
              
              {/* Availability Status */}
              {availabilityChecked && (
                <div className="availability-status">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <span>Availability updated for {formatDate(bookingDate)}</span>
                </div>
              )}
            </div>
            
            {/* Time Selection - Only show if availability has been checked */}
            <div className="booking-form-section">
              <h3>Select Start Time</h3>
              {!availabilityChecked && bookingDate ? (
                <div className="check-availability-prompt">
                  <p>Please check availability for your selected date before choosing a time slot.</p>
                </div>
              ) : !bookingDate ? (
                <div className="check-availability-prompt">
                  <p>Please select a date first.</p>
                </div>
              ) : (
                <div className="time-slots">
                  {availableStartTimes.map((timeObj, index) => (
                    <div 
                      key={index}
                      className={`time-slot ${startTime === timeObj.time ? 'selected' : ''} ${timeObj.available === false ? 'unavailable' : ''}`}
                      onClick={() => {
                        if (timeObj.available !== false) {
                          handleTimeSelect(timeObj.time);
                        }
                      }}
                    >
                      {timeObj.time}
                      {timeObj.available === false && <span className="unavailable-label">Unavailable</span>}
                    </div>
                  ))}
                </div>
              )}
              {formErrors.timeSlot && <div className="error-message">{formErrors.timeSlot}</div>}
              
              {startTime && endTime && (
                <div className="selected-time-info">
                  <p>Your service will start at <strong>{startTime}</strong> and is expected to finish around <strong>{endTime}</strong>.</p>
                </div>
              )}
            </div>
            
            {/* Duration Selection */}
            <div className="booking-form-section">
              <h3>Service Duration</h3>
              <div className="duration-selector">
                <label htmlFor="duration">How many hours do you need?</label>
                <select 
                  id="duration"
                  value={duration}
                  onChange={handleDurationChange}
                >
                  {[1, 2, 3, 4, 5, 6, 8].map(hours => (
                    <option key={hours} value={hours}>
                      {hours} hour{hours > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
                <div className="price-estimate">
                  <strong>Total Estimate:</strong> £{calculateTotalPrice()}
                </div>
              </div>
            </div>
            
            {/* Customer Information */}
            <div className="booking-form-section">
              <h3>Customer Information</h3>
              <div className="customer-fields">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name*</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={customer.firstName}
                      onChange={handleCustomerChange}
                      className={formErrors.customer?.includes('firstName') ? 'error' : ''}
                      placeholder="e.g., John"
                    />
                    {formErrors.customer?.includes('firstName') && 
                      <div className="error-message">First name is required</div>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name*</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={customer.lastName}
                      onChange={handleCustomerChange}
                      className={formErrors.customer?.includes('lastName') ? 'error' : ''}
                      placeholder="e.g., Smith"
                    />
                    {formErrors.customer?.includes('lastName') && 
                      <div className="error-message">Last name is required</div>}
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">Email Address*</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={customer.email}
                      onChange={handleCustomerChange}
                      className={formErrors.customer?.includes('email') ? 'error' : ''}
                      placeholder="e.g., john.smith@example.com"
                    />
                    {formErrors.customer?.includes('email') && 
                      <div className="error-message">Valid email is required</div>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number*</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={customer.phone}
                      onChange={handleCustomerChange}
                      className={formErrors.customer?.includes('phone') ? 'error' : ''}
                      placeholder="e.g., 07123 456789"
                    />
                    {formErrors.customer?.includes('phone') && 
                      <div className="error-message">Phone number is required</div>}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Service Location */}
            <div className="booking-form-section">
              <h3>Service Location</h3>
              <p className="service-location-info">Please provide the address where you'd like our service provider to meet you:</p>
              <div className="address-fields">
                <div className="form-group">
                  <label htmlFor="street">Street Address*</label>
                  <input
                    type="text"
                    id="street"
                    name="street"
                    value={address.street}
                    onChange={handleAddressChange}
                    className={formErrors.address?.includes('street') ? 'error' : ''}
                    placeholder="e.g., 123 Main Street, Apt 4"
                  />
                  {formErrors.address?.includes('street') && 
                    <div className="error-message">Street address is required</div>}
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city">City*</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={address.city}
                      onChange={handleAddressChange}
                      className={formErrors.address?.includes('city') ? 'error' : ''}
                      placeholder="e.g., London"
                    />
                    {formErrors.address?.includes('city') && 
                      <div className="error-message">City is required</div>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="state">County/State</label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={address.state}
                      onChange={handleAddressChange}
                      placeholder="e.g., Surrey"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="postalCode">Postal Code*</label>
                    <input
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      value={address.postalCode}
                      onChange={handleAddressChange}
                      className={formErrors.address?.includes('postalCode') ? 'error' : ''}
                      placeholder="e.g., SW1A 1AA"
                    />
                    {formErrors.address?.includes('postalCode') && 
                      <div className="error-message">Postal code is required</div>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="country">Country</label>
                    <select
                      id="country"
                      name="country"
                      value={address.country}
                      onChange={handleAddressChange}
                    >
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Ireland">Ireland</option>
                    </select>
                  </div>
                </div>
                
                <div className="service-location-note">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <span>Our service provider will travel to this location at the scheduled time.</span>
                </div>
              </div>
            </div>
            
            {/* Additional Notes */}
            <div className="booking-form-section">
              <h3>Additional Notes</h3>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional: Add any special requests or information the service provider should know..."
                rows="4"
              ></textarea>
            </div>
            
            {/* Booking Summary */}
            <div className="booking-summary">
              <h3>Booking Summary</h3>
              <div className="summary-details">
                <div className="summary-detail">
                  <span className="detail-label">Service:</span>
                  <span className="detail-value">{service.name}</span>
                </div>
                
                {bookingDate && (
                  <div className="summary-detail">
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">{formatDate(bookingDate)}</span>
                  </div>
                )}
                
                {startTime && endTime && (
                  <div className="summary-detail">
                    <span className="detail-label">Time:</span>
                    <span className="detail-value">{startTime} - {endTime}</span>
                  </div>
                )}
                
                <div className="summary-detail">
                  <span className="detail-label">Duration:</span>
                  <span className="detail-value">{duration} hour{duration > 1 ? 's' : ''}</span>
                </div>
                
                <div className="summary-detail">
                  <span className="detail-label">Total Price:</span>
                  <span className="detail-value highlight">£{calculateTotalPrice()}</span>
                </div>
                
                {/* Availability Status */}
                <div className="summary-detail">
                  <span className="detail-label">Availability:</span>
                  <span className={`detail-value ${availabilityChecked ? 'highlight-success' : 'highlight-warning'}`}>
                    {availabilityChecked ? 'Checked ✓' : 'Not checked yet ⚠️'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Error message for general errors */}
            {formErrors.general && (
              <div className="general-error-message">{formErrors.general}</div>
            )}
            
            {/* Form Actions */}
            <div className="booking-form-actions">
              <button 
                type="button" 
                className="cancel-booking-btn"
                onClick={() => navigate(`/services/${id}`)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="confirm-booking-btn"
                disabled={isSubmitting || !availabilityChecked}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : !availabilityChecked ? (
                  'Check Availability First'
                ) : (
                  'Confirm Booking'
                )}
              </button>
            </div>
          </form>
        </div>
        
        <div className="booking-sidebar">
          <div className="booking-policy">
            <h3>Booking Policy</h3>
            <ul>
              <li>Bookings can be cancelled up to 24 hours before the appointment without any charges.</li>
              <li>Late cancellations (less than 24 hours notice) may incur a fee of 50% of the service price.</li>
              <li>Please ensure someone is available at the service location at the scheduled time.</li>
              <li>Our service provider will call you 15-30 minutes before arrival.</li>
              <li>The minimum booking duration is 1 hour, with charges calculated on an hourly basis.</li>
            </ul>
          </div>
          
          <div className="need-help">
            <h3>Need Help?</h3>
            <p>If you need assistance with your booking, please contact our customer support:</p>
            <div className="contact-options">
              <div className="contact-option">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <span>(123) 456-7890</span>
              </div>
              <div className="contact-option">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <span>support@localservices.com</span>
              </div>
            </div>
          </div>
          
          <div className="payment-security">
            <h3>Secure Payment</h3>
            <p>All payments are processed securely. We use industry-standard encryption to protect your personal and payment information.</p>
            <div className="payment-security-icons">
              <span className="security-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </span>
              <span>Secure Encryption</span>
            </div>
          </div>
          
          {/* Review Information Box (New Addition) */}
          <div className="review-info-box">
            <h3>Customer Reviews</h3>
            <p>Read and write reviews about our services:</p>
            <ul>
              <li>Share your experience with other customers</li>
              <li>Rate our services on a scale of 1-5 stars</li>
              <li>Help others make informed decisions</li>
            </ul>
            <p>After your service is completed, you'll be able to leave a review. Your feedback helps us improve!</p>
          </div>
          
          {/* Availability Information Box */}
          <div className="availability-info-box">
            <h3>Availability Information</h3>
            <p>To ensure you get your preferred time slot:</p>
            <ul>
              <li>Select your preferred date first</li>
              <li>Click "Check Availability" to see available time slots</li>
              <li>Choose an available time slot</li>
              <li>Complete your booking details</li>
            </ul>
            <p><strong>Note:</strong> Availability is updated in real-time. Time slots may get booked by other customers, so we recommend completing your booking promptly after checking availability.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;