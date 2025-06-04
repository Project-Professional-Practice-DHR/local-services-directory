import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/Profile.css';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [user, setUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: ''
  });
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const navigate = useNavigate();
  
  // Using useCallback to memoize the fetchUserData function
  const fetchUserData = useCallback(async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Try to get user data from local storage first, with error handling for invalid JSON
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          // Make sure storedUser is valid JSON before parsing
          const parsedUser = JSON.parse(storedUser);
          setUser({
            firstName: parsedUser.firstName || 'John',
            lastName: parsedUser.lastName || 'Doe',
            email: parsedUser.email || 'john.doe@example.com',
            phoneNumber: parsedUser.phoneNumber || '+1234567890'
          });
          
          setFormData({
            firstName: parsedUser.firstName || 'John',
            lastName: parsedUser.lastName || 'Doe',
            email: parsedUser.email || 'john.doe@example.com',
            phoneNumber: parsedUser.phoneNumber || '+1234567890'
          });
        } catch (err) {
          console.error('Error parsing user data from localStorage:', err);
          // If JSON parsing fails, clear the invalid localStorage item
          localStorage.removeItem('user');
        }
      }
      
      // Fetch user profile from API
      try {
        const profileResponse = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (profileResponse.ok) {
          const data = await profileResponse.json();
          console.log('Profile API response data:', data);
          
          // Extract user data based on API response structure
          const userData = data.user || data.data || data;
          
          if (userData) {
            // Set user data with defaults for missing fields
            const updatedUser = {
              firstName: userData.firstName || user.firstName,
              lastName: userData.lastName || user.lastName,
              email: userData.email || user.email,
              phoneNumber: userData.phoneNumber || user.phoneNumber
            };
            
            setUser(updatedUser);
            setFormData(updatedUser);
            
            // Update localStorage with latest data
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        } else {
          console.log('Failed to fetch user data:', profileResponse.status);
          // Continue with locally stored data
        }
      } catch (err) {
        console.log('API fetch failed, using stored data:', err);
        // Continue with data already set
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Could not load your profile. Using demo data instead.');
      
      // Set fallback demo data
      setUser({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+1234567890'
      });
      
      setFormData({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+1234567890'
      });
    } finally {
      // Always set loading to false, even if there was an error
      setIsLoading(false);
    }
  }, [navigate, user.firstName, user.lastName, user.email, user.phoneNumber]);
  
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber
    });
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Update local state immediately for better UX
      setUser({
        ...user,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber
      });
      
      // IMPORTANT: Update localStorage
      const updatedUserData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUserData));
      
      // Try to update on server
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const response = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('Profile update response:', data);
            setSuccessMessage('Profile updated successfully!');
            
            // Clear success message after 3 seconds
            setTimeout(() => {
              setSuccessMessage('');
            }, 3000);
          } else {
            console.log('Server update failed:', response.status);
            setSuccessMessage('Profile updated locally. Server update failed.');
            
            // Clear success message after 3 seconds
            setTimeout(() => {
              setSuccessMessage('');
            }, 3000);
          }
        } catch (err) {
          console.log('Server update error:', err);
          setSuccessMessage('Profile updated locally. Could not connect to server.');
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            setSuccessMessage('');
          }, 3000);
        }
      } else {
        setSuccessMessage('Profile updated locally. Not authenticated with server.');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
      
      setIsEditing(false);
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Could not update profile on server, but local changes were saved.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Try to change password on server
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              currentPassword: passwordData.currentPassword,
              newPassword: passwordData.newPassword
            })
          });
          
          if (response.ok) {
            setSuccessMessage('Password changed successfully!');
            
            // Clear success message after 3 seconds
            setTimeout(() => {
              setSuccessMessage('');
            }, 3000);
            
            // Reset password fields
            setPasswordData({
              currentPassword: '',
              newPassword: '',
              confirmPassword: ''
            });
            
            // Close password form
            setIsChangingPassword(false);
          } else {
            // Try to parse error response
            try {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Password change failed');
            } catch (parseError) {
              throw new Error('Password change failed. Please try again.');
            }
          }
        } catch (err) {
          throw err;
        }
      } else {
        throw new Error('Not authenticated');
      }
      
    } catch (err) {
      console.error('Error changing password:', err);
      setError(err.message || 'Could not change password. Please try again.');
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    
    // Try to call logout endpoint
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(err => {
      console.log('Logout API call failed:', err);
    });
    
    navigate('/login');
  };
  
  // Show loading state only briefly, then show content even if API call is still pending
  if (isLoading && !user.firstName) {
    return (
      <div className="user-profile-page">
        <div className="user-profile-card user-loading-card">
          <div className="user-spinner"></div>
          <p>Loading profile...</p>
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
          <i className="fas fa-user-circle user-profile-icon"></i>
          My Profile
        </h1>

        <div className="user-profile-navigation">
          <Link to="/profile" className="user-nav-link active">
            <i className="fas fa-id-card"></i> Profile
          </Link>
          <Link to="/profile/bookings" className="user-nav-link">
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
        
        {successMessage && (
          <div className="user-success-message">
            {successMessage}
          </div>
        )}
        
        <div className="user-profile-content">
          <div className="user-profile-section">
            {!isEditing ? (
              <div className="user-profile-info">
                <div className="user-profile-data">
                  <div className="user-profile-field">
                    <label>First Name:</label>
                    <p>{user.firstName}</p>
                  </div>
                  
                  <div className="user-profile-field">
                    <label>Last Name:</label>
                    <p>{user.lastName}</p>
                  </div>
                  
                  <div className="user-profile-field">
                    <label>Email Address:</label>
                    <p>{user.email}</p>
                  </div>
                  
                  <div className="user-profile-field">
                    <label>Phone Number:</label>
                    <p>{user.phoneNumber || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="user-profile-actions">
                  <button 
                    className="user-edit-profile-btn"
                    onClick={handleEdit}
                  >
                    <i className="fas fa-edit"></i> Edit Profile
                  </button>
                  
                  <button 
                    className="user-change-password-btn"
                    onClick={() => setIsChangingPassword(true)}
                  >
                    <i className="fas fa-key"></i> Change Password
                  </button>
                  
                  <button 
                    className="user-logout-btn"
                    onClick={handleLogout}
                  >
                    <i className="fas fa-power-off"></i> Logout
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="user-profile-form">
                <div className="user-form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter your first name"
                    required
                    minLength="2"
                  />
                </div>
                
                <div className="user-form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Enter your last name"
                    required
                    minLength="2"
                  />
                </div>
                
                <div className="user-form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <div className="user-form-group">
                  <label htmlFor="phoneNumber">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="e.g., +1234567890"
                    pattern="^\+?[1-9]\d{1,14}$"
                    title="Phone number format should be like: +1234567890"
                  />
                </div>
                
                <div className="user-form-buttons">
                  <button 
                    type="submit" 
                    className="user-save-profile-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
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
            )}
            
            {isChangingPassword && (
              <div className="user-password-change-section">
                <h2>Change Password</h2>
                <form onSubmit={handlePasswordSubmit} className="user-password-form">
                  <div className="user-form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter current password"
                      required
                    />
                  </div>
                  
                  <div className="user-form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
                      required
                      minLength="8"
                    />
                  </div>
                  
                  <div className="user-form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                      required
                      minLength="8"
                    />
                  </div>
                  
                  <div className="user-form-buttons">
                    <button 
                      type="submit" 
                      className="user-save-password-btn"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Changing...' : 'Update Password'}
                    </button>
                    
                    <button 
                      type="button" 
                      className="user-cancel-password-btn"
                      onClick={() => setIsChangingPassword(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
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

export default Profile;