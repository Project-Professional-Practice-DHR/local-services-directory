import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/Profile.css';
import '../../styles/UserReviews.css';

const UserReviews = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [reviews, setReviews] = useState([]);
  const [editingReview, setEditingReview] = useState(null);
  const [reviewFormData, setReviewFormData] = useState({
    rating: 0,
    comment: ''
  });
  
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
  
  // Using useCallback to memoize the fetchReviews function
  const fetchReviews = useCallback(async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch reviews and include service details
      console.log("Fetching user reviews with service details...");
      
      let reviewsResponse;
      try {
        // Try the main reviews endpoint
        reviewsResponse = await fetch('/api/reviews/my-reviews', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (err) {
        console.error('Error with primary reviews endpoint:', err);
        // Try fallback endpoint if available
        reviewsResponse = await fetch('/api/review/my-reviews', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      console.log("API Response Status:", reviewsResponse.status);
      
      if (reviewsResponse.ok) {
        const data = await reviewsResponse.json();
        console.log("Full API Response:", data);
        
        if (data.success && Array.isArray(data.data)) {
          // Process the reviews to get service names
          const reviewsWithServiceNames = await Promise.all(data.data.map(async (review) => {
            let serviceName = 'Unknown Service';
            
            // Check if the API already includes the service name
            if (typeof review.service === 'object' && review.service && review.service.name) {
              serviceName = review.service.name;
            } else if (review.serviceName) {
              serviceName = review.serviceName;
            } else if (review.booking && review.booking.service && review.booking.service.name) {
              serviceName = review.booking.service.name;
            } else if (review.serviceId) {
              // If we have serviceId but not name, try to fetch it
              try {
                const serviceResponse = await fetch(`/api/services/${review.serviceId}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                
                if (serviceResponse.ok) {
                  const serviceData = await serviceResponse.json();
                  if (serviceData.success && serviceData.data && serviceData.data.name) {
                    serviceName = serviceData.data.name;
                  }
                }
              } catch (serviceErr) {
                console.warn('Could not fetch service details:', serviceErr);
              }
            } else if (review.booking && review.booking.serviceId) {
              // Try to get service from booking if available
              try {
                const serviceResponse = await fetch(`/api/services/${review.booking.serviceId}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                
                if (serviceResponse.ok) {
                  const serviceData = await serviceResponse.json();
                  if (serviceData.success && serviceData.data && serviceData.data.name) {
                    serviceName = serviceData.data.name;
                  }
                }
              } catch (serviceErr) {
                console.warn('Could not fetch service details from booking:', serviceErr);
              }
            }
            
            // Handle the case where "Service" is a literal string value rather than an object
            if (typeof review.service === 'string' && review.service !== 'Service') {
              serviceName = review.service;
            }
            
            // Extract the review text from potential field names
            const reviewText = review.comment || review.reviewText || review.content || '';
            
            // Ensure rating is a number
            const rating = parseInt(review.rating) || 0;
            
            return {
              ...review,
              actualServiceName: serviceName, // Store actual service name in a new field
              comment: reviewText,
              rating: rating
            };
          }));
          
          console.log("Processed reviews with service names:", reviewsWithServiceNames);
          setReviews(reviewsWithServiceNames);
        } else {
          console.log("No reviews found or invalid data format");
          setReviews([]);
        }
      } else {
        // Handle error response
        console.log("API error fetching reviews");
        setReviews([]);
      }
    } catch (err) {
      console.error('Error in reviews page:', err);
      setError('Failed to load reviews. Please try again.');
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);
  
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);
  
  const handleEditReview = (review) => {
    setEditingReview(review);
    setReviewFormData({
      rating: review.rating,
      comment: review.comment || ''
    });
  };
  
  const handleCancelEdit = () => {
    setEditingReview(null);
    setReviewFormData({ rating: 0, comment: '' });
  };
  
  const handleRatingChange = (newRating) => {
    setReviewFormData({
      ...reviewFormData,
      rating: newRating
    });
  };
  
  const handleCommentChange = (e) => {
    setReviewFormData({
      ...reviewFormData,
      comment: e.target.value
    });
  };
  
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!editingReview) return;
    
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/reviews/${editingReview.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rating: reviewFormData.rating,
          comment: reviewFormData.comment
        })
      });
      
      if (response.ok) {
        // Update the review in local state
        setReviews(reviews.map(review => 
          review.id === editingReview.id 
            ? { 
                ...review, 
                rating: reviewFormData.rating, 
                comment: reviewFormData.comment,
                updatedAt: new Date().toISOString()
              } 
            : review
        ));
        
        setSuccessMessage('Review updated successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
        
        // Reset form
        setEditingReview(null);
        setReviewFormData({ rating: 0, comment: '' });
      } else {
        throw new Error('Failed to update review');
      }
    } catch (err) {
      console.error('Error updating review:', err);
      setError('Failed to update review. Please try again.');
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }
    
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // Remove the review from local state
        setReviews(reviews.filter(review => review.id !== reviewId));
        
        setSuccessMessage('Review deleted successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        throw new Error('Failed to delete review');
      }
    } catch (err) {
      console.error('Error deleting review:', err);
      setError('Failed to delete review. Please try again.');
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Show loading state
  if (isLoading && reviews.length === 0) {
    return (
      <div className="user-profile-page">
        <div className="user-profile-card user-loading-card">
          <div className="user-spinner"></div>
          <p>Loading reviews...</p>
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
          <i className="fas fa-star user-profile-icon"></i>
          My Reviews
        </h1>
        
        <div className="user-profile-navigation">
          <Link to="/profile" className="user-nav-link">
            <i className="fas fa-user-circle"></i> Profile
          </Link>
          <Link to="/profile/bookings" className="user-nav-link">
            <i className="fas fa-calendar-check"></i> Bookings
          </Link>
          <Link to="/profile/reviews" className="user-nav-link active">
            <i className="fas fa-star"></i> Reviews
          </Link>
        </div>
        
        {error && (
          <div className="user-auth-error">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="user-success-message">
            {successMessage}
          </div>
        )}
        
        <div className="user-profile-content">
          <div className="user-reviews-section">
            <h2>Reviews You've Posted</h2>
            {reviews.length > 0 ? (
              <div className="user-reviews-list">
                {reviews.map((review) => (
                  <div className="user-review-card" key={review.id}>
                    {editingReview && editingReview.id === review.id ? (
                      // Edit Review Form
                      <form onSubmit={handleSubmitReview} className="user-edit-review-form">
                        <h3>{review.actualServiceName}</h3>
                        
                        <div className="user-rating-input">
                          <label>Your Rating:</label>
                          <div className="user-star-rating">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span 
                                key={star}
                                className={star <= reviewFormData.rating ? 'user-star filled clickable' : 'user-star clickable'}
                                onClick={() => handleRatingChange(star)}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="user-form-group">
                          <label htmlFor="reviewComment">Your Review:</label>
                          <textarea
                            id="reviewComment"
                            value={reviewFormData.comment}
                            onChange={handleCommentChange}
                            placeholder="Write your review here..."
                            rows="4"
                            required
                          ></textarea>
                        </div>
                        
                        <div className="user-form-buttons">
                          <button 
                            type="submit" 
                            className="user-save-review-btn"
                            disabled={isLoading}
                          >
                            {isLoading ? 'Saving...' : 'Save Review'}
                          </button>
                          
                          <button 
                            type="button" 
                            className="user-cancel-edit-btn"
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      // Review Display
                      <>
                        <div className="user-review-header">
                          <h3>{review.actualServiceName}</h3>
                          <div className="user-review-date">
                            {formatDate(review.createdAt)}
                            {review.updatedAt && review.updatedAt !== review.createdAt && (
                              <span className="user-edited-label"> (edited)</span>
                            )}
                          </div>
                        </div>
                        <div className="user-review-rating">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span 
                              key={i} 
                              className={i < review.rating ? 'user-star filled' : 'user-star'}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <div className="user-review-comment">
                          <p>{review.comment}</p>
                        </div>
                        <div className="user-review-actions">
                          <button 
                            className="user-edit-review-btn"
                            onClick={() => handleEditReview(review)}
                          >
                            <i className="fas fa-edit"></i> Edit
                          </button>
                          <button 
                            className="user-delete-review-btn"
                            onClick={() => handleDeleteReview(review.id)}
                          >
                            <i className="fas fa-trash"></i> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="user-empty-section">
                <i className="fas fa-comments user-empty-icon"></i>
                <p>You haven't written any reviews yet.</p>
                <Link to="/profile/bookings" className="user-browse-services-btn">
                  View Your Bookings
                </Link>
              </div>
            )}
          </div>
        </div>
        
        <Link to="/" className="user-back-home-btn">
          <i className="fas fa-arrow-left"></i> Back to Home
        </Link>
      </div>
    </div>
  );
};

export default UserReviews;