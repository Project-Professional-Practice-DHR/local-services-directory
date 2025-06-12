import { useState, useEffect } from 'react';
import '../../styles/ModerationPanel.css';

const ModerationPanel = () => {
  const [reports, setReports] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [flaggedContent, setFlaggedContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('flagged'); // Changed default to flagged since that's what we have routes for
  const [filter, setFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalFlagged: 0,
    pendingReview: 0,
    approved: 0,
    rejected: 0
  });

const API_BASE = '/api';

useEffect(() => {
  fetchModerationData();
  if (activeTab === 'flagged') {
    fetchStats();
  }
}, [activeTab, filter, searchTerm, currentPage]);

const fetchModerationData = async () => {
  try {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');

    if (!token) {
      setError('Authentication token not found');
      return;
    }

    // Only handle flagged content since that's what we have routes for
    if (activeTab !== 'flagged') {
      setIsLoading(false);
      return;
    }

    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: '10',
      ...(filter !== 'all' && { status: filter }),
      ...(searchTerm && { search: searchTerm })
    });

    const url = `${API_BASE}/admin/moderation/flagged?${params.toString()}`;
    console.log('Fetching flagged content from:', url);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Token used for moderation API call:', token);
    console.log('Moderation API Response status:', response.status);

    if (!response.ok) {
      if (response.status === 401) {
        setError('Authentication failed. Please login again.');
        return;
      }
      if (response.status === 403) {
        setError('Access denied. Admin permissions required.');
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Moderation data received:', data);

    // Handle different response structures
    if (data.success) {
      setFlaggedContent(data.flaggedContent || data.data || []);
      setTotalPages(data.totalPages || Math.ceil((data.total || 0) / 10));
    } else {
      setFlaggedContent(data.flaggedContent || data.data || []);
      setTotalPages(data.totalPages || 1);
    }

    setError(null);
  } catch (err) {
    console.error('Error fetching moderation data:', err);
    setError(`Failed to load moderation data: ${err.message}`);
  } finally {
    setIsLoading(false);
  }
};

const fetchStats = async () => {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
    
    const response = await fetch(`${API_BASE}/admin/moderation/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        setStats(data.stats || data);
      }
    }
  } catch (err) {
    console.error('Error fetching moderation stats:', err);
  }
};

const handleContentAction = async (contentId, action, reason = '') => {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
    
    const response = await fetch(`${API_BASE}/admin/moderation/flagged/${contentId}/action`, {
      method: 'PUT', // Changed from POST to PUT to match the route
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        action: action === 'approve' ? 'approve' : 'reject',
        ...(reason && { reason })
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      // Update the content in the list
      setFlaggedContent(flaggedContent.map(content => 
        content.id === contentId 
          ? { ...content, status: action === 'approve' ? 'approved' : 'rejected' }
          : content
      ));
      
      // Refresh stats
      fetchStats();
    }
    
  } catch (err) {
    console.error('Error handling content:', err);
    setError('Failed to process content');
  }
};

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'admin-status-badge pending',
      approved: 'admin-status-badge approved',
      rejected: 'admin-status-badge rejected'
    };

    return (
      <span className={statusClasses[status] || 'admin-status-badge'}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const getSeverityBadge = (severity) => {
    const severityClasses = {
      low: 'severity-badge low',
      medium: 'severity-badge medium',
      high: 'severity-badge high',
      critical: 'severity-badge critical'
    };

    return (
      <span className={severityClasses[severity] || 'severity-badge'}>
        {severity?.charAt(0).toUpperCase() + severity?.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Loading moderation data...</p>
      </div>
    );
  }

  return (
    <div className="admin-moderation-panel">
      {/* Header */}
      <div className="admin-header">
        <h2>Moderation Panel</h2>
        <div className="moderation-stats">
          <span className="stat-item">
            <i className="fas fa-flag"></i>
            {stats.pendingReview || 0} Pending Review
          </span>
          <span className="stat-item">
            <i className="fas fa-check-circle"></i>
            {stats.approved || 0} Approved
          </span>
          <span className="stat-item">
            <i className="fas fa-times-circle"></i>
            {stats.rejected || 0} Rejected
          </span>
        </div>
      </div>

      {/* Tabs - Only showing flagged content tab since that's what we have routes for */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'flagged' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('flagged');
            setCurrentPage(1);
          }}
        >
          <i className="fas fa-flag"></i>
          Flagged Content
        </button>
        <button
          className={`admin-tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('reports');
            setCurrentPage(1);
          }}
          disabled
          title="Reports moderation not yet implemented"
        >
          <i className="fas fa-exclamation-circle"></i>
          User Reports (Coming Soon)
        </button>
        <button
          className={`admin-tab ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('reviews');
            setCurrentPage(1);
          }}
          disabled
          title="Review moderation not yet implemented"
        >
          <i className="fas fa-star"></i>
          Review Moderation (Coming Soon)
        </button>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div className="admin-filter-group">
          <label>Status:</label>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="admin-select"
          >
            <option value="all">All Items</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="admin-search-group">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-search-input"
          />
          <i className="fas fa-search admin-search-icon"></i>
        </div>
      </div>

      {error && (
        <div className="admin-error-message">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
          <button 
            className="admin-btn admin-btn-sm" 
            onClick={() => fetchModerationData()}
            style={{ marginLeft: '10px' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Flagged Content Table */}
      {activeTab === 'flagged' && (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Content ID</th>
                <th>Type</th>
                <th>User</th>
                <th>Content Preview</th>
                <th>Reason</th>
                <th>Flagged Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {flaggedContent.map(content => (
                <tr key={content.id}>
                  <td><strong>#{content.id}</strong></td>
                  <td>
                    <span className="content-type">{content.contentType || content.type}</span>
                  </td>
                  <td>
                    <div className="admin-user-info">
                      <div className="admin-user-name">
                        {content.user?.firstName} {content.user?.lastName}
                      </div>
                      <div className="admin-user-details">
                        {content.user?.email}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="content-preview">
                      {content.contentPreview || content.preview || content.content}
                    </div>
                  </td>
                  <td>
                    <div className="flag-reason">
                      {content.flagReason || content.reason}
                    </div>
                  </td>
                  <td>{new Date(content.flaggedAt || content.createdAt).toLocaleDateString()}</td>
                  <td>{getStatusBadge(content.status)}</td>
                  <td>
                    <div className="admin-action-buttons">
                      {content.status === 'pending' && (
                        <>
                          <button
                            className="admin-btn admin-btn-approve"
                            onClick={() => handleContentAction(content.id, 'approve')}
                            title="Approve Content"
                          >
                            <i className="fas fa-check"></i>
                          </button>
                          <button
                            className="admin-btn admin-btn-reject"
                            onClick={() => handleContentAction(content.id, 'reject')}
                            title="Reject Content"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </>
                      )}
                      <button
                        className="admin-btn admin-btn-view"
                        title="View Full Content"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State for other tabs */}
      {(activeTab === 'reports' || activeTab === 'reviews') && (
        <div className="admin-empty-state">
          <div className="empty-state-icon">
            <i className="fas fa-construction"></i>
          </div>
          <h3>{activeTab === 'reports' ? 'User Reports' : 'Review Moderation'} Coming Soon</h3>
          <p>This feature is currently under development and will be available in a future update.</p>
        </div>
      )}

      {/* Empty State for flagged content */}
      {activeTab === 'flagged' && flaggedContent.length === 0 && !isLoading && (
        <div className="admin-empty-state">
          <div className="empty-state-icon">
            <i className="fas fa-inbox"></i>
          </div>
          <h3>No Flagged Content Found</h3>
          <p>
            {filter === 'pending' 
              ? `No pending flagged content at the moment.`
              : `No flagged content matches your current filters.`
            }
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="admin-pagination">
          <button
            className="admin-btn admin-btn-secondary"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <i className="fas fa-chevron-left"></i>
            Previous
          </button>
          
          <div className="pagination-info">
            Page {currentPage} of {totalPages}
          </div>
          
          <button
            className="admin-btn admin-btn-secondary"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default ModerationPanel;