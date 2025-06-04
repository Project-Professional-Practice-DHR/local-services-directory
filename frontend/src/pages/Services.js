import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ServicesData from '../mock/Services.json';
import '../styles/Service.css';

const Services = () => {
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const servicesPerPage = 12;

  // Login state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Fetch categories from mock data
  const categories = ServicesData.categories || [];

  // Filter services based on search and category
  const filteredServices = services.filter(service =>
    (selectedCategory ? service.category === selectedCategory : true) &&
    (searchTerm ?
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category.toLowerCase().includes(searchTerm.toLowerCase())
    : true)
  );

  // Calculate pagination
  const indexOfLastService = currentPage * servicesPerPage;
  const indexOfFirstService = indexOfLastService - servicesPerPage;
  const currentServices = filteredServices.slice(indexOfFirstService, indexOfLastService);
  const totalPages = Math.ceil(filteredServices.length / servicesPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Handle service click
  const handleServiceClick = (serviceId) => {
    navigate(`/services/${serviceId}`);
  };

  // Updated handle book now click with login check
  const handleBookNowClick = (serviceId, e) => {
    e.stopPropagation();
    
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    
    navigate(`/booking/${serviceId}`);
  };

  // Login prompt modal functions
  const closeLoginPrompt = () => {
    setShowLoginPrompt(false);
  };

  const handleLoginRedirect = () => {
    navigate('/login', { 
      state: { 
        from: '/services', 
        action: 'booking',
        message: 'Please login to book services' 
      } 
    });
  };

  // Load services on component mount
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    
    setServices(ServicesData.services || []);
    
    // Reset to first page when filters change
    setCurrentPage(1);
    
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, [searchTerm, selectedCategory]);

  return (
    <div className="page-container">
      <div className="services-main-page-wrapper">
        <div className="services-main-container">
          <div className="services-header">
            <h1>Our Services</h1>
            
            {/* Search and Filter Section */}
            <div className="services-search-filter">
              <input 
                type="text" 
                placeholder="Search services..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />

              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="category-select"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Categories Quick Filter */}
          <div className="categories-quick-filter">
            <button
              className={`category-quick-btn ${selectedCategory === '' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('')}
            >
              All
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                className={`category-quick-btn ${selectedCategory === category.name ? 'active' : ''}`}
                onClick={() => setSelectedCategory(
                  selectedCategory === category.name ? '' : category.name
                )}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Services List */}
          <div className="services-list">
            {currentServices.map(service => (
              <div 
                key={service.id} 
                className="service-list-item" 
                onClick={() => handleServiceClick(service.id)}
              >
                <div className="service-list-image">
                  <img 
                    src={service.image} 
                    alt={service.name}
                    onError={(e) => {
                      e.target.src = '/default-service-image.png';
                    }}
                  />
                  <div className="service-price-tag">
                    {service.price}
                  </div>
                </div>
                <div className="service-list-content">
                  <div className="service-list-header">
                    <h2>{service.name}</h2>
                    <span className="service-category">{service.category}</span>
                  </div>
                  
                  <div className="service-list-details">
                    <div className="service-list-meta">
                      <span className="service-rating">
                        ★ {service.rating.toFixed(1)} 
                        <span className="review-count">({service.reviewCount} reviews)</span>
                      </span>
                      <span className="service-price-info">
                        <span className="price-label">Price:</span> 
                        <span className="price-value">{service.price}</span>
                      </span>
                    </div>
                    
                    <p className="service-brief-description">
                      {service.description.length > 150 
                        ? `${service.description.slice(0, 150)}...` 
                        : service.description}
                    </p>
                    
                    <div className="service-list-actions">
                      <button 
                        className="view-service-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleServiceClick(service.id);
                        }}
                      >
                        View Details
                      </button>
                      <button 
                        className="book-service-btn"
                        onClick={(e) => handleBookNowClick(service.id, e)}
                      >
                        {isLoggedIn ? `Book Now · ${service.price}` : `Login to Book · ${service.price}`}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* No Services Found Message */}
          {filteredServices.length === 0 && (
            <div className="no-services">
              <p>No services found matching your search or filter.</p>
            </div>
          )}
          
          {/* Pagination */}
          {filteredServices.length > 0 && (
            <div className="pagination">
              <button 
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-button"
              >
                &laquo; Previous
              </button>
              
              <div className="page-numbers">
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => paginate(index + 1)}
                    className={`page-number ${currentPage === index + 1 ? 'active' : ''}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              
              <button 
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-button"
              >
                Next &raquo;
              </button>
              
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
            </div>
          )}
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
              <p>You need to be logged in to book this service.</p>
              
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
    </div>
  );
};

export default Services;