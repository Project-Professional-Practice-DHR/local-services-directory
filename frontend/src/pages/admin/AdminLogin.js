import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/AdminLogin.css';


const AdminLogin = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // For development/testing, you can use a mock login
      // In production, uncomment the actual API call
      
      // const response = await axios.post('/api/admin/login', credentials);
      // localStorage.setItem('adminToken', response.data.token);
      
      // For testing - just set a dummy token
      localStorage.setItem('adminToken', 'test-admin-token');
      
      // Redirect to admin dashboard after login
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-form-container">
        <h1>Admin Login</h1>
        <p>Enter your credentials to access the admin dashboard</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              placeholder="Enter your username"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button 
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;