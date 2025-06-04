import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ServicesData from '../mock/Services.json';
import '../styles/ServiceDetail.css';
import axios from 'axios';

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [userPreviousBookings, setUserPreviousBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Login prompt modal state
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginPromptAction, setLoginPromptAction] = useState(''); // 'booking' or 'review'
  
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    // Simulate API call to fetch service details
    setTimeout(() => {
      try {
        const foundService = ServicesData.services.find(s => s.id.toString() === id);
        
        if (foundService) {
          setService(foundService);
        } else {
          setError('Service not found');
        }
        
        setLoading(false);
      } catch (err) {
        setError('Error loading service details');
        setLoading(false);
      }
    }, 300); // Simulating network delay
    
    // If user is logged in, fetch their previous bookings for this service
    if (token) {
      fetchUserBookings(token);
    }
  }, [id]);
  
  // Fetch user's previous bookings for this service
  const fetchUserBookings = async (token) => {
    try {
      // In a real application, this would be an API call to get user's completed bookings
      // For demo purposes, we'll simulate this with a setTimeout
      /*
      setTimeout(() => {
        // Mock data - in a real app, this would come from your API
        const mockCompletedBookings = [
          {
            id: 'booking-1',
            serviceId: id,
            serviceName: 'Professional Home Cleaning',
            date: '2025-03-15',
            status: 'completed'
          },
          {
            id: 'booking-2',
            serviceId: id,
            serviceName: 'Professional Home Cleaning',
            date: '2025-02-20',
            status: 'completed'
          }
        ];
        
        setUserPreviousBookings(mockCompletedBookings);
      }, 500);
      */
      
      // Real API call would look like this:
      
      const response = await axios.get(`/api/booking/my-bookings?serviceId=${id}&status=completed`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success && response.data.data) {
        setUserPreviousBookings(response.data.data);
      }
      
    } catch (err) {
      console.error('Error fetching user bookings:', err);
    }
  };
  
  // Updated handleBookNow with login check
  const handleBookNow = () => {
    if (!isLoggedIn) {
      setLoginPromptAction('booking');
      setShowLoginPrompt(true);
      return;
    }
    navigate(`/booking/${id}`);
  };
  
  // Review handling functions
  const openReviewModal = () => {
    if (!isLoggedIn) {
      setLoginPromptAction('review');
      setShowLoginPrompt(true);
      return;
    }
    
    setShowReviewModal(true);
  };
  
  const closeReviewModal = () => {
    setShowReviewModal(false);
    setReviewRating(5);
    setReviewComment('');
    setReviewError(null);
    setSelectedBookingId('');
  };
  
  // Login prompt modal functions
  const closeLoginPrompt = () => {
    setShowLoginPrompt(false);
    setLoginPromptAction('');
  };
  
  const handleLoginRedirect = () => {
    const actionText = loginPromptAction === 'booking' ? 'book this service' : 'leave a review';
    navigate('/login', { 
      state: { 
        from: `/services/${id}`, 
        action: loginPromptAction,
        message: `Please login to ${actionText}` 
      } 
    });
  };
  
  const handleRatingChange = (rating) => {
    setReviewRating(rating);
  };
  
  const handleCommentChange = (e) => {
    setReviewComment(e.target.value);
  };
  
  const handleBookingSelect = (e) => {
    setSelectedBookingId(e.target.value);
  };
  
  // This is the updated handleSubmitReview function
const handleSubmitReview = async (e) => {
  e.preventDefault();
  
  // Validate form
  if (!reviewComment.trim()) {
    setReviewError('Please provide a review comment');
    return;
  }
  
  if (userPreviousBookings.length > 0 && !selectedBookingId) {
    setReviewError('Please select a booking');
    return;
  }
  
  setIsSubmittingReview(true);
  setReviewError(null);
  
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    // Create review data
    // Note: The serviceId is passed as is - the backend will handle UUID conversion
    const reviewData = {
      serviceId: id, // We're keeping this as is
      bookingId: selectedBookingId || null,
      rating: reviewRating,
      comment: reviewComment
    };
    
    console.log('Submitting review:', reviewData);
    
    try {
      // Make the API call
      const response = await axios.post('/api/reviews', reviewData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Handle successful response
      if (response.data.success) {
        setReviewSuccess(true);
        
        // If we had real API integration, we would update the service with the new review
        if (service) {
          // Add the new review to the service
          const newReview = {
            id: response.data.data.id || `review-${Date.now()}`,
            user: localStorage.getItem('userName') || 'You',
            date: new Date().toLocaleDateString(),
            rating: reviewRating,
            comment: reviewComment
          };
          
          // Update service with new review
          setService({
            ...service,
            reviews: [newReview, ...(service.reviews || [])],
            reviewCount: (service.reviewCount || 0) + 1,
            // Recalculate average rating
            rating: service.reviews 
              ? ((service.rating * service.reviewCount) + reviewRating) / (service.reviewCount + 1)
              : reviewRating
          });
        }
        
        // Close modal after a delay
        setTimeout(() => {
          closeReviewModal();
          setReviewSuccess(false);
        }, 2000);
      } else {
        // Handle unsuccessful response
        setReviewError(response.data.message || 'Failed to submit review');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setReviewError(err.response?.data?.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  } catch (err) {
    console.error('Error submitting review:', err);
    setReviewError('An unexpected error occurred. Please try again.');
    setIsSubmittingReview(false);
  }
};
  
  if (loading) {
    return (
      <div className="service-page-wrapper">
        <div className="service-detail-loading">
          <div className="loading-spinner"></div>
          <p>Loading service details...</p>
        </div>
      </div>
    );
  }
  
  if (error || !service) {
    return (
      <div className="service-page-wrapper">
        <div className="service-detail-error">
          <h2>{error || 'Service not found'}</h2>
          <Link to="/services" className="back-to-services">
            Back to Services
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="service-page-wrapper">
      {/* Hero Section with Split Layout */}
      <div className="service-hero-section">
        <div className="service-nav">
          <Link to="/services" className="back-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to All Services
          </Link>
          <span className="service-category-badge">{service.category}</span>
        </div>
        
        {/* Split layout container */}
        <div className="service-split-layout">
          {/* Left side - Hero image */}
          <div className="service-hero-image-container">
            <img 
              src={service.image} 
              alt={service.name}
              className="service-image"
              onError={(e) => {
                e.target.src = '/default-service-image.png';
              }}
            />
          </div>
          
          {/* Right side - Service content */}
          <div className="service-hero-content">
            <div className="service-title-area">
              <h1>{service.name}</h1>
              
              <div className="service-meta-info">
                <div className="service-rating-large">
                  <span className="stars">★ {service.rating.toFixed(1)}</span>
                  <span className="review-count">({service.reviewCount} reviews)</span>
                </div>
                <div className="service-price-large">
                  {service.priceRange}
                </div>
              </div>
            </div>
            
            <div className="service-short-description">
              <p>{service.description}</p>
            </div>
            
            <div className="service-features-preview">
              <h3>Key Features</h3>
              <ul>
                <li>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  Professional and experienced service providers
                </li>
                <li>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  Satisfaction guaranteed
                </li>
                <li>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  Flexible scheduling options
                </li>
              </ul>
            </div>
            
            <div className="service-actions">
              <button className="book-service-btn" onClick={handleBookNow}>Book Now</button>
            </div>
          </div>
        </div>
      </div>
        
      {/* Content Sections */}
      <div className="service-content-container">
        <div className="service-content-wrapper">
          <div className="service-detail-content">
            <div className="service-description">
              <h2>About This Service</h2>
              <p>{service.description}</p>
              
              {/* Service features */}
              <div className="service-features">
                <h3>Features</h3>
                <ul>
                  <li>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    Professional and experienced service providers
                  </li>
                  <li>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    Satisfaction guaranteed
                  </li>
                  <li>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    Flexible scheduling options
                  </li>
                  <li>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    Transparent pricing with no hidden fees
                  </li>
                  <li>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    Available for both residential and commercial clients
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="service-reviews">
              <div className="reviews-header">
                <h2>Customer Reviews</h2>
                <button className="write-review-btn" onClick={openReviewModal}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  {isLoggedIn ? 'Write a Review' : 'Login to Review'}
                </button>
              </div>
              
              <div className="review-summary">
                <div className="rating-summary">
                  <div className="big-rating">{service.rating.toFixed(1)}</div>
                  <div className="rating-stars">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span 
                        key={star} 
                        className={`star ${star <= Math.round(service.rating) ? 'filled' : ''}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <div className="total-reviews">{service.reviewCount} reviews</div>
                </div>
              </div>
              
              <div className="review-list">
                {service.reviews && service.reviews.map(review => (
                  <div key={review.id} className="review-item">
                    <div className="review-header">
                      <div className="reviewer-avatar">{review.user.charAt(0)}</div>
                      <div className="reviewer-info">
                        <div className="reviewer-name">{review.user}</div>
                        <div className="review-date">{review.date}</div>
                      </div>
                    </div>
                    
                    <div className="review-rating">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span 
                          key={star} 
                          className={`star ${star <= review.rating ? 'filled' : ''}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    
                    <div className="review-comment">
                      {review.comment}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Show more reviews button if there are more than displayed */}
              {service.reviews && service.reviews.length < service.reviewCount && (
                <button className="load-more-reviews">
                  Load More Reviews
                </button>
              )}
            </div>
          </div>
        
          {/* Contact Information Card - Updated with modern styling */}
          <div className="contact-info-section">
            <h2>Contact Information</h2>
            <div className="contact-info-grid">
              <div className="contact-info-item">
                <div className="contact-info-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <div className="contact-info-content">
                  <h3>EMAIL</h3>
                  <p>{service.email || 'info@serviceprovider.com'}</p>
                </div>
              </div>
              
              <div className="contact-info-item">
                <div className="contact-info-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div className="contact-info-content">
                  <h3>PHONE</h3>
                  <p>{service.phone || '(123) 456-7890'}</p>
                </div>
              </div>
              
              <div className="contact-info-item">
                <div className="contact-info-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div className="contact-info-content">
                  <h3>ADDRESS</h3>
                  <p>{service.address || '123 Business Ave, Suite 100, City, State 12345'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="service-cta">
            <h2>Ready to Book This Service?</h2>
            <p>Schedule your appointment now and experience our exceptional service.</p>
            <button className="book-service-btn-large" onClick={handleBookNow}>
              {isLoggedIn ? 'Book Now' : 'Login to Book'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="modal-overlay">
          <div className="login-prompt-modal">
            <div className="modal-header">
              <h3>Login Required</h3>
              <button className="close-modal" onClick={closeLoginPrompt}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="modal-content">
              <div className="login-prompt-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
              </div>
              
              <h4>Please Login First</h4>
              <p>
                {loginPromptAction === 'booking' 
                  ? 'You need to be logged in to book this service.' 
                  : 'You need to be logged in to leave a review.'
                }
              </p>
              
              <div className="login-prompt-actions">
                <button className="cancel-btn" onClick={closeLoginPrompt}>
                  Cancel
                </button>
                <button className="login-btn" onClick={handleLoginRedirect}>
                  Go to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Review Modal */}
      {showReviewModal && (
        <div className="modal-overlay">
          <div className="review-modal">
            <div className="modal-header">
              <h3>Write a Review</h3>
              <button className="close-modal" onClick={closeReviewModal}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="modal-content">
              {reviewSuccess ? (
                <div className="review-success-message">
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <h4>Thank You for Your Review!</h4>
                  <p>Your feedback helps others make informed decisions about our services.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview}>
                  <div className="form-group">
                    <label>Service</label>
                    <div className="service-name-display">{service.name}</div>
                  </div>
                  
                  {userPreviousBookings.length > 0 && (
                    <div className="form-group">
                      <label htmlFor="booking-select">Select Booking</label>
                      <select 
                        id="booking-select" 
                        value={selectedBookingId}
                        onChange={handleBookingSelect}
                        required
                      >
                        <option value="">-- Select a booking --</option>
                        {userPreviousBookings.map(booking => (
                          <option key={booking.id} value={booking.id}>
                            {new Date(booking.date).toLocaleDateString()} - {booking.serviceName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div className="form-group">
                    <label>Your Rating</label>
                    <div className="rating-select">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span 
                          key={star}
                          className={`rating-star ${reviewRating >= star ? 'selected' : ''}`}
                          onClick={() => handleRatingChange(star)}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="review-comment">Your Review</label>
                    <textarea
                      id="review-comment"
                      placeholder="Share your experience with this service..."
                      value={reviewComment}
                      onChange={handleCommentChange}
                      rows="5"
                      required
                    ></textarea>
                  </div>
                  
                  {reviewError && (
                    <div className="error-message">
                      {reviewError}
                    </div>
                  )}
                  
                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="cancel-btn" 
                      onClick={closeReviewModal}
                      disabled={isSubmittingReview}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="submit-review-btn" 
                      disabled={isSubmittingReview}
                    >
                      {isSubmittingReview ? (
                        <><span className="spinner"></span> Submitting...</>
                      ) : (
                        'Submit Review'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceDetail;