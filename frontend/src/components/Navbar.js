import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check authentication status on mount and when location changes
  useEffect(() => {
    checkAuthStatus();
  }, [location.pathname]);

  // Listen for localStorage changes (when user data is updated elsewhere)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user' || e.key === 'userDataUpdated') {
        console.log('User data changed in localStorage, refreshing...');
        checkAuthStatus();
      }
    };

    // Listen for storage events from other tabs/components
    window.addEventListener('storage', handleStorageChange);

    // Also check periodically for localStorage changes within the same tab
    const intervalId = setInterval(() => {
      const wasUserDataUpdated = localStorage.getItem('userDataUpdated') === 'true';
      if (wasUserDataUpdated) {
        localStorage.removeItem('userDataUpdated');
        console.log('User data update flag detected, refreshing...');
        checkAuthStatus();
      }
    }, 1000); // Check every second

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, []);
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Close menu when route changes
  useEffect(() => {
    setMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location]);
  
  // Check if user is authenticated by looking at localStorage 
  // and fetch user data if needed
  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (token && isLoggedIn) {
      setIsAuthenticated(true);
      
      // Try to get user data from localStorage first for immediate display
      const userDataString = localStorage.getItem('user');
      if (userDataString) {
        try {
          const parsedUserData = JSON.parse(userDataString);
          console.log('User data from localStorage:', parsedUserData);
          setUserData(parsedUserData);
        } catch (e) {
          console.error('Error parsing user data from localStorage', e);
        }
      }
      
      // Try multiple endpoints to get complete user data
      try {
        console.log('Fetching fresh user data from server...');
        
        // Try the profile endpoint first
        let response = await fetch('http://localhost:5001/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        // If profile endpoint fails, try alternative endpoints
        if (!response.ok) {
          console.log('Profile endpoint failed, trying /api/user/profile...');
          response = await fetch('http://localhost:5001/api/user/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        }
        
        if (!response.ok) {
          console.log('User profile endpoint failed, trying /api/auth/me...');
          response = await fetch('http://localhost:5001/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        }
        
        if (response.ok) {
          const responseData = await response.json();
          console.log('🔍 FULL API RESPONSE:', JSON.stringify(responseData, null, 2));
          
          // Extract user data based on API response structure
          let fetchedUserData = null;
          
          if (responseData.user) {
            fetchedUserData = responseData.user;
            console.log('📦 Using responseData.user:', fetchedUserData);
          } else if (responseData.data && responseData.data.user) {
            fetchedUserData = responseData.data.user;
            console.log('📦 Using responseData.data.user:', fetchedUserData);
          } else if (responseData.data) {
            fetchedUserData = responseData.data;
            console.log('📦 Using responseData.data:', fetchedUserData);
          } else {
            fetchedUserData = responseData;
            console.log('📦 Using responseData directly:', fetchedUserData);
          }
          
          console.log('✅ FINAL PROCESSED USER DATA:', JSON.stringify(fetchedUserData, null, 2));
          console.log('Username field:', fetchedUserData?.username);
          console.log('FirstName field:', fetchedUserData?.firstName);
          console.log('LastName field:', fetchedUserData?.lastName);
          
          // Update both state and localStorage with latest data
          setUserData(fetchedUserData);
          localStorage.setItem('user', JSON.stringify(fetchedUserData));
        } else {
          console.error('❌ All user profile endpoints failed:', response.status, response.statusText);
          const errorText = await response.text();
          console.error('Error response:', errorText);
        }
      } catch (error) {
        console.error('❌ Error during user data fetch:', error);
      }
    } else {
      setIsAuthenticated(false);
      setUserData(null);
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      // Call logout API endpoint if available
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await fetch('http://localhost:5001/api/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        } catch (error) {
          console.error('Error during logout API call:', error);
          // Continue with logout process even if API call fails
        }
      }
    } finally {
      // Clear all authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('user');
      localStorage.removeItem('rememberedEmail');
      
      // Update state
      setIsAuthenticated(false);
      setUserData(null);
      
      // Close dropdown
      setUserDropdownOpen(false);
      
      // Redirect to home page
      navigate('/');
    }
  };
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (userData) {
      // Try to get initials from first name and last name
      if (userData.firstName && userData.lastName) {
        return `${userData.firstName.charAt(0)}${userData.lastName.charAt(0)}`.toUpperCase();
      }
      
      // Try with username
      if (userData.username) {
        return userData.username.substring(0, 2).toUpperCase();
      }
      
      // Try with just first name
      if (userData.firstName) {
        return userData.firstName.substring(0, 2).toUpperCase();
      }
      
      // Try with email
      if (userData.email) {
        return userData.email.substring(0, 2).toUpperCase();
      }
    }
    return 'US'; // Default as fallback
  };
  
  // Get display name for user
  const getDisplayName = () => {
    // Debug: Log user data to see what's available
    console.log('User data for display name:', userData);
    
    if (userData) {
      // Priority 1: Use first name and last name if available
      if (userData.firstName && userData.lastName) {
        console.log('Using firstName + lastName:', userData.firstName, userData.lastName);
        return `${userData.firstName} ${userData.lastName}`;
      }
      
      // Priority 2: Use first name if available
      if (userData.firstName) {
        console.log('Using firstName only:', userData.firstName);
        return userData.firstName;
      }
      
      // Priority 3: Use last name if available
      if (userData.lastName) {
        console.log('Using lastName only:', userData.lastName);
        return userData.lastName;
      }
      
      // Priority 4: Use username as fallback
      if (userData.username) {
        console.log('Using username as fallback:', userData.username);
        return userData.username;
      }
      
      // Priority 5: Use email
      if (userData.email) {
        console.log('Using email part:', userData.email.split('@')[0]);
        return userData.email.split('@')[0];
      }
    }
    console.log('Falling back to "User"');
    return 'User';
  };
  
  // Get user email safely
  const getUserEmail = () => {
    return userData && userData.email ? userData.email : '';
  };
  
  // Get first name for greeting
  const getFirstName = () => {
    if (userData) {
      // Use first name if available
      if (userData.firstName) {
        return userData.firstName;
      }
      
      // Fallback to username
      if (userData.username) {
        return userData.username;
      }
      
      // Fallback to first part of display name
      const displayName = getDisplayName();
      return displayName.split(' ')[0];
    }
    return 'User';
  };
  
  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-backdrop"></div>
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span className="logo-text">LocalServices</span>
        </Link>
        
        {/* Mobile menu toggle */}
        <button 
          className={`menu-toggle ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
        >
          <span className="toggle-bar"></span>
          <span className="toggle-bar"></span>
          <span className="toggle-bar"></span>
        </button>
        
        {/* Navigation links */}
        <div className={`navbar-menu ${menuOpen ? 'active' : ''}`}>
          <ul className="navbar-links">
            <li className="nav-item">
              <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                <span className="nav-icon home-icon">🏠</span>
                <span className="nav-text">Home</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/services" className={location.pathname === '/services' ? 'active' : ''}>
                <span className="nav-icon services-icon">🛠️</span>
                <span className="nav-text">Services</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/about" className={location.pathname === '/about' ? 'active' : ''}>
                <span className="nav-icon about-icon">ℹ️</span>
                <span className="nav-text">About</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/contact" className={location.pathname === '/contact' ? 'active' : ''}>
                <span className="nav-icon contact-icon">📞</span>
                <span className="nav-text">Contact</span>
              </Link>
            </li>
          </ul>
          
          {/* Actions section */}
          <div className="navbar-actions">
            {/* User section */}
            {isAuthenticated ? (
              <div className={`user-menu-container ${userDropdownOpen ? 'active' : ''}`}>
                <button 
                  className="user-profile-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  style={{ backgroundColor: '#f0f0f0', color: '#333' }}
                >
                  <div className="user-avatar" style={{ backgroundColor: '#2a41e8', color: 'white' }}>
                    <span>{getUserInitials()}</span>
                  </div>
                  <span className="user-name" style={{ color: '#333' }}>{getDisplayName()}</span>
                  <span className="dropdown-arrow"></span>
                </button>
                
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <span className="greeting">Hello, {getFirstName()}</span>
                    <span className="user-email">{getUserEmail()}</span>
                  </div>
                  
                  <div className="dropdown-menu">
                    <Link to="/profile" className="dropdown-item">
                      <span className="dropdown-icon">👤</span>
                      <span>Profile</span>
                    </Link>
                    
                    <button className="dropdown-item logout-btn" onClick={handleLogout}>
                      <span className="dropdown-icon">🚪</span>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Auth buttons */}
                <div className="auth-buttons">
                  <Link to="/login" className="login-btn">Login</Link>
                  <Link to="/register" className="register-btn">
                    Register
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Menu backdrop - closes menu when clicked */}
      {menuOpen && (
        <div 
          className="menu-backdrop"
          onClick={() => setMenuOpen(false)}
        ></div>
      )}
    </nav>
  );
};

export default Navbar;