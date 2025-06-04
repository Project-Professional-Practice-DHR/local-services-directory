import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

// Import ServicesData from your JSON file
import ServicesData from '../mock/Services.json';

const Home = () => {
  const [featuredServices, setFeaturedServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [hasBusiness, setHasBusiness] = useState(false);
  
  // Check authentication status and business listing status
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      
      if (token && isLoggedIn) {
        setIsAuthenticated(true);
        
        // Try to get user data
        const userDataString = localStorage.getItem('user');
        if (userDataString) {
          try {
            const parsedUserData = JSON.parse(userDataString);
            setUserData(parsedUserData);
            
            // Check if user has a business listed
            const hasBusinessListed = localStorage.getItem('hasBusiness') === 'true' || 
              (parsedUserData.businessId !== undefined && parsedUserData.businessId !== null);
            setHasBusiness(hasBusinessListed);
          } catch (e) {
            console.error('Error parsing user data', e);
          }
        }
      } else {
        setIsAuthenticated(false);
        setUserData(null);
        setHasBusiness(false);
      }
    };
    
    checkAuth();
  }, []);

  // Get user's first name for personalized greeting
  const getUserFirstName = () => {
    if (userData) {
      if (userData.firstName) {
        return userData.firstName;
      }
      if (userData.profile && userData.profile.firstName) {
        return userData.profile.firstName;
      }
      if (userData.username) {
        return userData.username.split(' ')[0];
      }
      if (userData.email) {
        return userData.email.split('@')[0];
      }
    }
    return '';
  };

  // Setup services data
  useEffect(() => {
    // Get the top 3 services from your services.json data
    const services = ServicesData.services.slice(0, 3);
    setFeaturedServices(services);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading services...</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Modern Hero Section - Removed curve/wave */}
      <div className="hero-section modern-hero">
        <div className="hero-content">
          {isAuthenticated && (
            <div className="welcome-message">
              <h2>Welcome back, {getUserFirstName()}!</h2>
            </div>
          )}
          
          <h1>Find Trusted Local Services</h1>
          <p>Connect with top-rated professionals in your area</p>
          
          {/* Modernized User Options with animations */}
          <div className="user-options modern-options">
            {!isAuthenticated && (
              <>
                <Link to="/register" className="option-card modern-card">
                  <div className="option-icon modern-icon signup-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M20 8v6"></path>
                      <path d="M23 11h-6"></path>
                    </svg>
                  </div>
                  <div className="card-content">
                    <h3>Sign Up</h3>
                    <p>Create an account to access all features</p>
                  </div>
                </Link>
                
                <Link to="/services" className="option-card modern-card">
                  <div className="option-icon modern-icon search-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </div>
                  <div className="card-content">
                    <h3>Find Services</h3>
                    <p>Search for the services you need</p>
                  </div>
                </Link>
              </>
            )}
            
            {isAuthenticated && !hasBusiness && (
              <>
                <Link to="/list-business" className="option-card modern-card">
                  <div className="option-icon modern-icon business-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                      <path d="M12 11v4"></path>
                      <path d="M8 11h8"></path>
                    </svg>
                  </div>
                  <div className="card-content">
                    <h3>List Your Business</h3>
                    <p>Reach more customers by listing your services</p>
                  </div>
                </Link>
                
                <Link to="/services" className="option-card modern-card">
                  <div className="option-icon modern-icon search-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </div>
                  <div className="card-content">
                    <h3>Find Services</h3>
                    <p>Search for the services you need</p>
                  </div>
                </Link>
              </>
            )}
            
            {isAuthenticated && hasBusiness && (
              <>
                <Link to="/my-business" className="option-card modern-card">
                  <div className="option-icon modern-icon business-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                  </div>
                  <div className="card-content">
                    <h3>Your Business</h3>
                    <p>Manage your business listing and see stats</p>
                  </div>
                </Link>
                
                <Link to="/services" className="option-card modern-card">
                  <div className="option-icon modern-icon search-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </div>
                  <div className="card-content">
                    <h3>Find Services</h3>
                    <p>Search for the services you need</p>
                  </div>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* How It Works Section with modern design */}
      <div className="how-it-works-section modern-section">
        <div className="container">
          <div className="section-header">
            <h2 className="animate__animated animate__fadeIn">How It Works</h2>
            <p className="animate__animated animate__fadeIn animate__delay-1s">Finding the right service provider is easy with LocalServices</p>
          </div>
          
          <div className="steps-container modern-steps">
            <div className="step-card modern-step-card animate__animated animate__fadeInUp animate__delay-1s">
              <div className="step-number">1</div>
              <div className="step-icon">🔍</div>
              <h3>Search</h3>
              <p>Find the service you need by searching or browsing categories</p>
            </div>
            
            <div className="step-card modern-step-card animate__animated animate__fadeInUp animate__delay-2s">
              <div className="step-number">2</div>
              <div className="step-icon">💬</div>
              <h3>Connect</h3>
              <p>Contact service providers directly to discuss your needs</p>
            </div>
            
            <div className="step-card modern-step-card animate__animated animate__fadeInUp animate__delay-3s">
              <div className="step-number">3</div>
              <div className="step-icon">🤝</div>
              <h3>Book</h3>
              <p>Schedule the service and get the job done right</p>
            </div>
            
            <div className="step-card modern-step-card animate__animated animate__fadeInUp animate__delay-4s">
              <div className="step-number">4</div>
              <div className="step-icon">⭐</div>
              <h3>Review</h3>
              <p>Share your experience to help others find great providers</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Section with modern design - Modified to remove ratings and cities */}
      <div className="stats-section modern-stats">
        <div className="container">
          <div className="stats-container">
            <div className="stat-card modern-stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-number">2,500+</div>
              <div className="stat-label">Service Providers</div>
            </div>
            <div className="stat-card modern-stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-number">15,000+</div>
              <div className="stat-label">Jobs Completed</div>
            </div>
            <div className="stat-card modern-stat-card">
              <div className="stat-icon">👍</div>
              <div className="stat-number">98%</div>
              <div className="stat-label">Customer Satisfaction</div>
            </div>
          </div>
        </div>
      </div>
      
      
      {/* Featured Services Section with modern design */}
      {featuredServices.length > 0 && (
        <div className="featured-section modern-featured">
          <div className="container">
            <div className="section-header">
              <h2 className="animate__animated animate__fadeIn">Featured Services</h2>
              <p className="animate__animated animate__fadeIn animate__delay-1s">Top-rated professionals ready to help</p>
            </div>
            
            <div className="featured-services modern-services">
              {featuredServices.map((service, index) => (
                <Link to={`/services/${service.id}`} key={`featured-${service.id}`} className={`featured-service-link animate__animated animate__fadeInUp animate__delay-${index+1}s`}>
                  <div className="featured-card modern-featured-card">
                    <div className="featured-image">
                      <img src={service.image || "/images/default-service.jpg"} alt={service.name} />
                      <div className="featured-tag modern-tag">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        Featured
                      </div>
                    </div>
                    <div className="featured-content">
                      <h3>{service.name}</h3>
                      <div className="featured-rating">
                        <div className="stars modern-stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg 
                              key={star}
                              className={`star-icon ${star <= Math.floor(service.rating) ? 'filled' : 'empty'}`}
                              xmlns="http://www.w3.org/2000/svg" 
                              viewBox="0 0 24 24" 
                              fill={star <= Math.floor(service.rating) ? "currentColor" : "none"}
                              stroke="currentColor" 
                              strokeWidth="2"
                            >
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                            </svg>
                          ))}
                        </div>
                        <span className="rating-number">{service.rating.toFixed(1)}</span>
                      </div>
                      <div className="featured-meta modern-meta">
                        <span className="featured-category">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                            <line x1="7" y1="7" x2="7.01" y2="7"></line>
                          </svg>
                          {service.category}
                        </span>
                        {service.priceRange && (
                          <span className="featured-price">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="1" x2="12" y2="23"></line>
                              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                            {service.priceRange}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            <div className="view-all-container">
              <Link to="/services" className="view-all-btn modern-btn animate__animated animate__pulse animate__infinite">Browse All Services</Link>
            </div>
          </div>
        </div>
      )}
      
      
      {/* Call to Action Section with modern design */}
      <div className="cta-section modern-cta">
        <div className="container">
          <div className="cta-content animate__animated animate__fadeIn">
            <h2>Ready to get started?</h2>
            {!isAuthenticated ? (
              <>
                <p>Join our platform today to list your business or find services</p>
                <div className="cta-buttons modern-cta-buttons">
                  <Link to="/register" className="cta-button primary modern-primary animate__animated animate__pulse animate__infinite">Register Now</Link>
                  <Link to="/about" className="cta-button secondary modern-secondary">Learn More</Link>
                </div>
              </>
            ) : (
              <>
                <p>Discover top-rated service providers in your area</p>
                <div className="cta-buttons modern-cta-buttons">
                  <Link to="/services" className="cta-button primary modern-primary animate__animated animate__pulse animate__infinite">Browse Services</Link>
                  {!hasBusiness && (
                    <Link to="/list-business" className="cta-button secondary modern-secondary">List Your Business</Link>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Testimonials Section with modern design */}
      <div className="testimonials-section modern-testimonials">
        <div className="container">
          <div className="section-header">
            <h2 className="animate__animated animate__fadeIn">What Our Users Say</h2>
            <p className="animate__animated animate__fadeIn animate__delay-1s">Read testimonials from satisfied customers</p>
          </div>
          
          <div className="testimonials-container modern-testimonial-container">
            <div className="testimonial-card modern-testimonial animate__animated animate__fadeInUp">
              <div className="testimonial-rating modern-rating">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                ))}
              </div>
              <p className="testimonial-text">"Found an amazing plumber in minutes. The service was quick and professional. Will definitely use LocalServices again!"</p>
              <div className="testimonial-author modern-author">
                <div className="author-avatar modern-avatar">JD</div>
                <div className="author-info">
                  <h4>John Doe</h4>
                  <p>Halifax, NS</p>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card modern-testimonial animate__animated animate__fadeInUp animate__delay-1s">
              <div className="testimonial-rating modern-rating">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                ))}
              </div>
              <p className="testimonial-text">"As a service provider, this platform has helped me grow my business tremendously. The interface is easy to use and customers love it!"</p>
              <div className="testimonial-author modern-author">
                <div className="author-avatar modern-avatar">JS</div>
                <div className="author-info">
                  <h4>Jane Smith</h4>
                  <p>Service Provider</p>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card modern-testimonial animate__animated animate__fadeInUp animate__delay-2s">
              <div className="testimonial-rating modern-rating">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                ))}
              </div>
              <p className="testimonial-text">"The ability to compare different service providers and read reviews made my decision so much easier. Highly recommended!"</p>
              <div className="testimonial-author modern-author">
                <div className="author-avatar modern-avatar">RJ</div>
                <div className="author-info">
                  <h4>Robert Johnson</h4>
                  <p>Bedford, NS</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      

    </div>
  );
};

export default Home;