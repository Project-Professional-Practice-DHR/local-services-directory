import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserApproval from './UserApproval';
import CategoryManager from './CategoryManager';
import BookingOverview from './BookingOverview';
import AnalyticsPanel from './AnalyticsPanel';
import ModerationPanel from './ModerationPanel';
import '../../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage] = useState('');
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalProviders: 0,
    totalBookings: 0,
    pendingApprovals: 0,
    flaggedContent: 0,
    revenue: 0
  });

  const navigate = useNavigate();

  // Check admin authentication with improved logic
  useEffect(() => {
    const checkAdminAuth = () => {
      // Check for token first (main token or admin-specific token)
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const userStr = localStorage.getItem('user') || localStorage.getItem('adminUser');
      
      console.log('🔍 Checking admin authentication...');
      console.log('Token exists:', !!token);
      console.log('User data exists:', !!userStr);
      
      if (!token) {
        console.log('❌ No token found, redirecting to login');
        navigate('/admin/login'); // Redirect to admin login, not regular login
        return false;
      }

      if (!userStr) {
        console.log('❌ No user data found, redirecting to login');
        navigate('/admin/login');
        return false;
      }

      try {
        const userData = JSON.parse(userStr);
        console.log('👤 User data:', { email: userData.email, role: userData.role });
        
        if (userData.role !== 'admin') {
          console.log('❌ User is not admin, redirecting to main site');
          navigate('/'); // Redirect non-admin users to main site
          return false;
        }
        
        console.log('✅ Admin authentication successful');
        return true;
      } catch (err) {
        console.error('❌ Error parsing user data:', err);
        navigate('/admin/login');
        return false;
      }
    };

    // Only fetch stats if authentication passes AND we're on dashboard
    if (checkAdminAuth() && activeSection === 'dashboard') {
      fetchDashboardStats();
    }
  }, [navigate, activeSection]); // Added activeSection dependency

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      setError(null); // Clear previous errors
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');

      console.log('🔄 Fetching dashboard stats...');
      console.log('Using token:', token ? 'Token present' : 'No token');

      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Dashboard API response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          console.log('❌ Token expired or invalid');
          handleLogout();
          return;
        }
        const errorText = await response.text();
        console.error('❌ Dashboard API error:', errorText);
        throw new Error(`Failed to fetch dashboard stats: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 Dashboard data received:', data);

      if (data.success) {
        // More robust data extraction with fallbacks
        const stats = data.stats || data.data || data;
        
        setDashboardStats({
          totalUsers: parseInt(stats.totalUsers) || 0,
          totalProviders: parseInt(stats.totalProviders) || 0,
          totalBookings: parseInt(stats.totalBookings) || 0,
          pendingApprovals: parseInt(stats.pendingApprovals) || 0,
          flaggedContent: parseInt(stats.flaggedContent) || 0,
          revenue: parseFloat(stats.revenue) || 0
        });
        
        console.log('✅ Dashboard stats updated successfully');
      } else {
        // Handle case where success is false but data might still be present
        console.warn('⚠️ API returned success: false, but attempting to use data anyway');
        const stats = data.stats || data.data || data;
        
        setDashboardStats({
          totalUsers: parseInt(stats.totalUsers) || 0,
          totalProviders: parseInt(stats.totalProviders) || 0,
          totalBookings: parseInt(stats.totalBookings) || 0,
          pendingApprovals: parseInt(stats.pendingApprovals) || 0,
          flaggedContent: parseInt(stats.flaggedContent) || 0,
          revenue: parseFloat(stats.revenue) || 0
        });
      }
    } catch (err) {
      console.error('❌ Error fetching dashboard stats:', err);
      setError(`Failed to load dashboard statistics: ${err.message}`);
      
      // Don't reset stats to zero on error - keep existing values
      // This prevents the UI from showing zeros when there's a temporary network issue
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    console.log('🚪 Admin logout initiated');
    
    // Clear all possible token and user data variations
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    localStorage.removeItem('adminUser');
    
    // Call logout API if available
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(err => {
      console.log('Logout API call failed:', err);
    });
    
    console.log('✅ Logout successful, redirecting to admin login');
    navigate('/admin/login'); // Redirect to admin login page
  };

  // Clear error when switching sections
  const handleSectionChange = (section) => {
    setActiveSection(section);
    setError(null); // Clear any previous errors
  };

  // Add a refresh function for manual retry
  const handleRefreshStats = () => {
    console.log('🔄 Manual refresh triggered');
    fetchDashboardStats();
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'users':
        return <UserApproval />;
      case 'categories':
        return <CategoryManager />;
      case 'bookings':
        return <BookingOverview />;
      case 'analytics':
        return <AnalyticsPanel />;
      case 'moderation':
        return <ModerationPanel />;
      default:
        return renderDashboardOverview();
    }
  };

  const renderDashboardOverview = () => (
    <div className="admin-overview">
      {/* Add refresh button for dashboard */}
      <div className="admin-dashboard-controls">
        <button 
          className="admin-btn admin-btn-secondary"
          onClick={handleRefreshStats}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> Refreshing...
            </>
          ) : (
            <>
              <i className="fas fa-sync-alt"></i> Refresh Stats
            </>
          )}
        </button>
      </div>

      <div className="admin-stats-grid">
        {/* Stat Cards */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon"><i className="fas fa-users"></i></div>
          <div className="admin-stat-content">
            <h3>{(dashboardStats.totalUsers || 0).toLocaleString()}</h3>
            <p>Total Users</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon"><i className="fas fa-user-tie"></i></div>
          <div className="admin-stat-content">
            <h3>{(dashboardStats.totalProviders || 0).toLocaleString()}</h3>
            <p>Service Providers</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon"><i className="fas fa-calendar-check"></i></div>
          <div className="admin-stat-content">
            <h3>{(dashboardStats.totalBookings || 0).toLocaleString()}</h3>
            <p>Total Bookings</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon"><i className="fas fa-clock"></i></div>
          <div className="admin-stat-content">
            <h3>{dashboardStats.pendingApprovals || 0}</h3>
            <p>Pending Approvals</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon"><i className="fas fa-flag"></i></div>
          <div className="admin-stat-content">
            <h3>{dashboardStats.flaggedContent || 0}</h3>
            <p>Flagged Content</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon"><i className="fas fa-dollar-sign"></i></div>
          <div className="admin-stat-content">
            <h3>£{(dashboardStats.revenue || 0).toLocaleString()}</h3>
            <p>Revenue</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="admin-quick-actions">
        <h2>Quick Actions</h2>
        <div className="admin-action-grid">
          <button className="admin-action-btn" onClick={() => handleSectionChange('users')}>
            <i className="fas fa-user-check"></i> Review User Approvals
          </button>
          <button className="admin-action-btn" onClick={() => handleSectionChange('moderation')}>
            <i className="fas fa-flag"></i> Handle Flagged Content
          </button>
          <button className="admin-action-btn" onClick={() => handleSectionChange('categories')}>
            <i className="fas fa-tags"></i> Manage Categories
          </button>
          <button className="admin-action-btn" onClick={() => handleSectionChange('analytics')}>
            <i className="fas fa-chart-bar"></i> View Analytics
          </button>
        </div>
      </div>
    </div>
  );

  if (isLoading && activeSection === 'dashboard' && !dashboardStats.totalUsers) {
    return (
      <div className="admin-dashboard-page">
        <div className="admin-dashboard-card admin-loading-card">
          <div className="admin-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page">
      <div className="admin-dashboard-container">
        
        {/* Header */}
        <div className="admin-header">
          <div className="admin-header-left">
            <span className="admin-logo-text">LocalServices Admin</span>
          </div>
          <div className="admin-header-right">
            <Link to="/" className="admin-header-btn">
              <i className="fas fa-arrow-left"></i> Back to Main Site
            </Link>
            <button className="admin-header-btn" onClick={handleLogout}>
              <i className="fas fa-power-off"></i> Logout
            </button>
          </div>
        </div>

        <div className="admin-main-content">
          
          {/* Sidebar */}
          <div className="admin-sidebar">
            <nav className="admin-nav">
              <button
                className={`admin-nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}
                onClick={() => handleSectionChange('dashboard')}
              >
                <i className="fas fa-tachometer-alt"></i>
                <span>Dashboard</span>
              </button>
              <button
                className={`admin-nav-item ${activeSection === 'users' ? 'active' : ''}`}
                onClick={() => handleSectionChange('users')}
              >
                <i className="fas fa-users"></i>
                <span>Users Management</span>
                {(dashboardStats.pendingApprovals || 0) > 0 && (
                  <span className="admin-badge">{dashboardStats.pendingApprovals}</span>
                )}
              </button>
              <button
                className={`admin-nav-item ${activeSection === 'categories' ? 'active' : ''}`}
                onClick={() => handleSectionChange('categories')}
              >
                <i className="fas fa-tags"></i>
                <span>Categories Management</span>
              </button>
              <button
                className={`admin-nav-item ${activeSection === 'bookings' ? 'active' : ''}`}
                onClick={() => handleSectionChange('bookings')}
              >
                <i className="fas fa-calendar-check"></i>
                <span>Bookings Management</span>
              </button>
              <button
                className={`admin-nav-item ${activeSection === 'analytics' ? 'active' : ''}`}
                onClick={() => handleSectionChange('analytics')}
              >
                <i className="fas fa-chart-bar"></i>
                <span>Analytics</span>
              </button>
              <button
                className={`admin-nav-item ${activeSection === 'moderation' ? 'active' : ''}`}
                onClick={() => handleSectionChange('moderation')}
              >
                <i className="fas fa-shield-alt"></i>
                <span>Moderation</span>
                {(dashboardStats.flaggedContent || 0) > 0 && (
                  <span className="admin-badge">{dashboardStats.flaggedContent}</span>
                )}
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="admin-content">
            <div className="admin-content-header">
              <h1 className="admin-page-title">
                {activeSection === 'dashboard' && 'Dashboard Overview'}
                {activeSection === 'users' && 'User Management'}
                {activeSection === 'categories' && 'Category Management'}
                {activeSection === 'bookings' && 'Booking Overview'}
                {activeSection === 'analytics' && 'Analytics'}
                {activeSection === 'moderation' && 'Content Moderation'}
              </h1>
            </div>

            {error && activeSection === 'dashboard' && (
              <div className="admin-error-message">
                <i className="fas fa-exclamation-triangle"></i>
                {error}
                <button 
                  className="admin-btn admin-btn-sm" 
                  onClick={handleRefreshStats}
                  style={{ marginLeft: '10px' }}
                >
                  Retry
                </button>
              </div>
            )}

            {successMessage && (
              <div className="admin-success-message">{successMessage}</div>
            )}

            <div className="admin-content-body">
              {renderActiveSection()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;