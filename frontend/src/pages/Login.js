// src/pages/Login.js
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// Make sure this CSS file exists
import '../styles/Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsLoading(true);
      
      try {
        // Make API call to the backend
        // IMPORTANT: Use the relative URL with proxy
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        });
        
        // For debugging - log the response status
        console.log('Login response status:', response.status);
        
        const data = await response.json();
        
        // For debugging - log the response data
        console.log('Login response data:', data);
        
        if (!response.ok) {
          // Handle specific error cases based on status code or error message
          let errorMessage = 'Login failed. Please try again.';
          
          if (response.status === 401) {
            // Check if it's specifically about wrong password or invalid email
            if (data.msg && data.msg.toLowerCase().includes('password')) {
              errorMessage = 'Wrong password. Please check your password and try again.';
            } else if (data.msg && (data.msg.toLowerCase().includes('email') || data.msg.toLowerCase().includes('user not found'))) {
              errorMessage = 'Email not found. Please check your email address or register for a new account.';
            } else {
              errorMessage = 'Invalid email or password. Please check your credentials and try again.';
            }
          } else if (response.status === 404) {
            errorMessage = 'Email not found. Please check your email address or register for a new account.';
          } else if (response.status === 400) {
            // Bad request - could be validation error
            if (data.msg && data.msg.toLowerCase().includes('email')) {
              errorMessage = 'Please enter a valid email address.';
            } else if (data.msg && data.msg.toLowerCase().includes('password')) {
              errorMessage = 'Wrong password. Please check your password and try again.';
            } else {
              errorMessage = data.msg || 'Please check your login details and try again.';
            }
          } else {
            // Use the message from the server if available
            errorMessage = data.msg || data.message || errorMessage;
          }
          
          throw new Error(errorMessage);
        }
        
        // Store the token in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('isLoggedIn', 'true');
        
        // If remember me is checked, set a longer expiration
        if (formData.rememberMe) {
          // This is just for demo - in a real app, you'd handle this on the server
          localStorage.setItem('rememberMe', 'true');
        }
        
        // Redirect to home page
        navigate('/');
        
      } catch (error) {
        console.error('Login error:', error);
        setErrors({
          auth: error.message
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <span className="logo-text">LocalServices</span>
        </div>
        <h1 className="login-title">
          <i className="fas fa-sign-in-alt login-icon"></i>
          Login
        </h1>
        
        {errors.auth && (
          <div className="auth-error">
            {errors.auth}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className={errors.password ? 'input-error' : ''}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>
          
          <div className="form-options">
            <div className="remember-me">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
              />
              <label htmlFor="rememberMe">Remember Me</label>
            </div>
            <Link to="/forgot-password" className="forgot-password">
              Forgot Password?
            </Link>
          </div>
          
          <button 
            type="submit" 
            className={`login-submit-btn ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
{isLoading ? 'Logging you in, please wait...' : 'Login'}
          </button>
        </form>
        

        
        <div className="register-prompt">
          <p>Don't have an account? <Link to="/register" className="register-link">Register Here</Link></p>
        </div>
        
        <Link to="/" className="back-home-btn">
          <i className="fas fa-arrow-left"></i> Back to Home
        </Link>
      </div>
    </div>
  );
};

export default Login;