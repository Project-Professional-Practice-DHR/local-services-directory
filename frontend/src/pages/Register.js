import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: 'customer'
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear specific error when user starts typing, but keep other errors visible
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
    
    // Real-time validation for password confirmation
    if (name === 'confirmPassword' || name === 'password') {
      const password = name === 'password' ? value : formData.password;
      const confirmPassword = name === 'confirmPassword' ? value : formData.confirmPassword;
      
      if (confirmPassword && password !== confirmPassword) {
        setErrors(prev => ({
          ...prev,
          confirmPassword: 'Passwords do not match'
        }));
      } else if (password === confirmPassword && errors.confirmPassword) {
        setErrors(prev => ({
          ...prev,
          confirmPassword: ''
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // First Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    } else if (!/^[a-zA-Z\s'-]+$/.test(formData.firstName.trim())) {
      newErrors.firstName = 'First name can only contain letters, spaces, hyphens, and apostrophes';
    }
    
    // Last Name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    } else if (!/^[a-zA-Z\s'-]+$/.test(formData.lastName.trim())) {
      newErrors.lastName = 'Last name can only contain letters, spaces, hyphens, and apostrophes';
    }
    
    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username.trim().length > 20) {
      newErrors.username = 'Username must be less than 20 characters';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username.trim())) {
      newErrors.username = 'Username can only contain letters, numbers, underscores, and hyphens';
    }
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Phone Number validation (optional field, but validate format if provided)
    if (formData.phoneNumber.trim()) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(formData.phoneNumber.replace(/[\s()-]/g, ''))) {
        newErrors.phoneNumber = 'Please enter a valid phone number (e.g., +1234567890 or 1234567890)';
      }
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordErrors = [];
      
      if (formData.password.length < 8) {
        passwordErrors.push('at least 8 characters');
      }
      if (!/(?=.*[a-z])/.test(formData.password)) {
        passwordErrors.push('one lowercase letter');
      }
      if (!/(?=.*[A-Z])/.test(formData.password)) {
        passwordErrors.push('one uppercase letter');
      }
      if (!/(?=.*\d)/.test(formData.password)) {
        passwordErrors.push('one number');
      }
      if (!/(?=.*[@$!%*?&])/.test(formData.password)) {
        passwordErrors.push('one special character (@$!%*?&)');
      }
      
      if (passwordErrors.length > 0) {
        newErrors.password = `Password must contain ${passwordErrors.join(', ')}`;
      }
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Terms agreement validation
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleServerError = (error, data) => {
    const serverErrors = {};
    
    // Handle different types of server errors
    if (data && data.errors) {
      // Handle validation errors array
      if (Array.isArray(data.errors)) {
        data.errors.forEach(err => {
          if (err.field) {
            serverErrors[err.field] = err.message;
          }
        });
      }
      // Handle object-based errors
      else if (typeof data.errors === 'object') {
        Object.keys(data.errors).forEach(field => {
          serverErrors[field] = data.errors[field];
        });
      }
    }
    
    // Handle specific common server errors
    if (data && data.message) {
      const message = data.message.toLowerCase();
      
      if (message.includes('username') && (message.includes('taken') || message.includes('exists') || message.includes('already'))) {
        serverErrors.username = 'This username is already taken. Please choose another one.';
      }
      else if (message.includes('email') && (message.includes('taken') || message.includes('exists') || message.includes('already'))) {
        serverErrors.email = 'This email is already registered. Please use a different email or try logging in.';
      }
      else if (message.includes('phone') && (message.includes('taken') || message.includes('exists') || message.includes('already'))) {
        serverErrors.phoneNumber = 'This phone number is already registered.';
      }
      else if (message.includes('invalid') && message.includes('email')) {
        serverErrors.email = 'Please enter a valid email address.';
      }
      else if (message.includes('invalid') && message.includes('phone')) {
        serverErrors.phoneNumber = 'Please enter a valid phone number.';
      }
      else if (message.includes('password') && message.includes('weak')) {
        serverErrors.password = 'Password is too weak. Please choose a stronger password.';
      }
      else {
        // Generic server error
        serverErrors.auth = data.message;
      }
    }
    else {
      // Fallback for unknown errors
      serverErrors.auth = error.message || 'Registration failed. Please try again.';
    }
    
    setErrors(serverErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    setSuccessMessage('');
    
    if (validateForm()) {
      setIsLoading(true);
      
      try {
        console.log('Attempting to register with:', {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          username: formData.username.trim(),
          email: formData.email.trim(),
          role: formData.role
        });
        
        // Create the request payload
        const requestPayload = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role
        };
        
        // Add phone number if provided
        if (formData.phoneNumber.trim()) {
          requestPayload.phoneNumber = formData.phoneNumber.trim();
        }
        
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestPayload)
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries([...response.headers]));
        
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        let data;
        try {
          data = JSON.parse(responseText);
          console.log('Registration response:', data);
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          throw new Error(`Server returned invalid response. Please try again later.`);
        }
        
        if (!response.ok) {
          // Handle server errors with detailed error parsing
          throw new Error(data.message || 'Registration failed');
        }
        
        // Store authentication data
        if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('isLoggedIn', 'true');
          
          if (data.user || data.data) {
            const userData = data.user || data.data;
            localStorage.setItem('user', JSON.stringify(userData));
          }
        }
        
        setSuccessMessage('Registration successful! Welcome to LocalServices. Redirecting to homepage...');
        
        // Redirect after delay
        setTimeout(() => {
          navigate('/', { state: { welcomeMessage: 'Welcome to LocalServices!' } });
        }, 2000);
        
      } catch (error) {
        console.error('Registration error:', error);
        
        // Try to parse server response for detailed errors
        try {
          const errorData = JSON.parse(error.message);
          handleServerError(error, errorData);
        } catch {
          // If we can't parse the error, try to get it from the caught error
          handleServerError(error, null);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Helper function to check if there are any errors
  const hasErrors = Object.keys(errors).length > 0;
         
  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-header">
          <span className="logo-text">LocalServices</span>
        </div>
        <h1 className="register-title">
          <i className="fas fa-user-plus register-icon"></i>
          Register
        </h1>
        
        {errors.auth && (
          <div className="auth-error">
            <i className="fas fa-exclamation-triangle"></i>
            {errors.auth}
          </div>
        )}
        
        {successMessage && (
          <div className="success-message">
            <i className="fas fa-check-circle"></i>
            {successMessage}
          </div>
        )}
        
        {hasErrors && !errors.auth && (
          <div className="validation-summary">
            <i className="fas fa-exclamation-triangle"></i>
            Please fix the following errors:
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="firstName">First Name *</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Enter your first name"
              className={errors.firstName ? 'input-error' : ''}
              maxLength="50"
            />
            {errors.firstName && <span className="error-message">
              <i className="fas fa-exclamation-circle"></i>
              {errors.firstName}
            </span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="lastName">Last Name *</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Enter your last name"
              className={errors.lastName ? 'input-error' : ''}
              maxLength="50"
            />
            {errors.lastName && <span className="error-message">
              <i className="fas fa-exclamation-circle"></i>
              {errors.lastName}
            </span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="username">Username *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a unique username"
              className={errors.username ? 'input-error' : ''}
              maxLength="20"
            />
            {errors.username && <span className="error-message">
              <i className="fas fa-exclamation-circle"></i>
              {errors.username}
            </span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email address"
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <span className="error-message">
              <i className="fas fa-exclamation-circle"></i>
              {errors.email}
            </span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="e.g., +1234567890 or 1234567890"
              className={errors.phoneNumber ? 'input-error' : ''}
            />
            {errors.phoneNumber && <span className="error-message">
              <i className="fas fa-exclamation-circle"></i>
              {errors.phoneNumber}
            </span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a strong password"
              className={errors.password ? 'input-error' : ''}
            />
            {errors.password && <span className="error-message">
              <i className="fas fa-exclamation-circle"></i>
              {errors.password}
            </span>}
            <div className="password-requirements">
              <small>Password must contain at least 8 characters, including uppercase, lowercase, number, and special character</small>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              className={errors.confirmPassword ? 'input-error' : ''}
            />
            {errors.confirmPassword && <span className="error-message">
              <i className="fas fa-exclamation-circle"></i>
              {errors.confirmPassword}
            </span>}
          </div>
          

          
          <div className="form-group checkbox-group">
            <div className="agree-terms">
              <input
                type="checkbox"
                id="agreeTerms"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                className={errors.agreeTerms ? 'checkbox-error' : ''}
              />
              <label htmlFor="agreeTerms">
                I agree to the <Link to="/terms" className="terms-link" target="_blank">Terms and Conditions</Link> and <Link to="/privacy" className="terms-link" target="_blank">Privacy Policy</Link> *
              </label>
            </div>
            {errors.agreeTerms && <span className="error-message">
              <i className="fas fa-exclamation-circle"></i>
              {errors.agreeTerms}
            </span>}
          </div>
          
          <button 
            type="submit" 
            className={`register-submit-btn ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Creating Account...
              </>
            ) : (
              <>
                <i className="fas fa-user-plus"></i>
                Create Account
              </>
            )}
          </button>
        </form>

        
        <div className="login-prompt">
          <p>Already have an account? <Link to="/login" className="login-link">Sign In Here</Link></p>
        </div>
        
        <Link to="/" className="back-home-btn">
          <i className="fas fa-arrow-left"></i> Back to Home
        </Link>
      </div>
    </div>
  );
};

export default Register;