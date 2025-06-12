import { useState, useEffect } from 'react';
import '../../styles/UserApproval.css';

const UserApproval = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [filter, searchTerm, currentPage]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(filter !== 'all' && { role: filter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/admin/users?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data.users || data.data || data);
      setTotalPages(data.pagination?.pages || Math.ceil((data.pagination?.total || data.total || 0) / 10));
      setError(null);
      
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const showSuccessMessage = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const showErrorMessage = (message) => {
    setError(message);
    setTimeout(() => setError(null), 3000);
  };

  // Toggle user active/inactive status
  const handleToggleUserStatus = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      showSuccessMessage(result.message);
      fetchUsers();
      
    } catch (err) {
      console.error('Error toggling user status:', err);
      showErrorMessage('Failed to update user status');
    }
  };

  // Approve/Verify provider
  const handleApproveUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/users/${userId}/toggle-verification`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      showSuccessMessage(result.message);
      fetchUsers();
      
    } catch (err) {
      console.error('Error approving user:', err);
      showErrorMessage('Failed to approve user');
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      showSuccessMessage(result.message);
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
      
    } catch (err) {
      console.error('Error deleting user:', err);
      showErrorMessage('Failed to delete user');
    }
  };

  // Reset user password
  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      showErrorMessage('Password must be at least 6 characters long');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/users/${selectedUser.id}/reset-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newPassword })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      showSuccessMessage(result.message);
      setShowPasswordModal(false);
      setSelectedUser(null);
      setNewPassword('');
      
    } catch (err) {
      console.error('Error resetting password:', err);
      showErrorMessage('Failed to reset password');
    }
  };

  const getStatusBadge = (user) => {
    if (user.role === 'provider' && !user.isVerified) {
      return <span className="admin-status-badge pending">Pending Verification</span>;
    }
    if (user.isActive) {
      return <span className="admin-status-badge active">Active</span>;
    } else {
      return <span className="admin-status-badge suspended">Inactive</span>;
    }
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const openPasswordModal = (user) => {
    setSelectedUser(user);
    setShowPasswordModal(true);
  };

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="admin-user-approval">
      {/* Success Message */}
      {success && (
        <div className="admin-success-message">
          <i className="fas fa-check-circle"></i>
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="admin-error-message">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      {/* Filters and Search */}
      <div className="admin-filters">
        <div className="admin-filter-group">
          <label>Filter by:</label>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="admin-select"
          >
            <option value="all">All Users</option>
            <option value="provider">Service Providers</option>
            <option value="customer">Customers</option>
            <option value="admin">Administrators</option>
          </select>
        </div>

        <div className="admin-search-group">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-search-input"
          />
          <i className="fas fa-search admin-search-icon"></i>
        </div>
      </div>

      {/* Users Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Verified</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>
                  <div className="admin-user-info">
                    <div className="admin-user-avatar">
                      <i className="fas fa-user"></i>
                    </div>
                    <div>
                      <div className="admin-user-name">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="admin-user-details">
                        {user.phone} • {user.city}
                      </div>
                    </div>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <span className={`admin-role-badge ${user.role}`}>
                    {user.role}
                  </span>
                </td>
                <td>{getStatusBadge(user)}</td>
                <td>
                  {user.role === 'provider' ? (
                    <span className={`admin-verification-badge ${user.isVerified ? 'verified' : 'unverified'}`}>
                      {user.isVerified ? 'Verified' : 'Unverified'}
                    </span>
                  ) : (
                    <span className="admin-verification-badge na">N/A</span>
                  )}
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                <div className="admin-action-buttons">
                  {/* Toggle Active/Inactive Status */}
                  <button
                    className={`admin-btn ${user.isActive ? 'admin-btn-suspend' : 'admin-btn-activate'}`}
                    onClick={() => handleToggleUserStatus(user.id)}
                    title={user.isActive ? 'Deactivate User' : 'Activate User'}
                  >
                    <i className={`fas ${user.isActive ? 'fa-ban' : 'fa-check'}`}></i>
                    {user.isActive ? 'Suspend' : 'Activate'}
                  </button>

                  {/* Reset Password */}
                  <button
                    className="admin-btn admin-btn-password"
                    onClick={() => openPasswordModal(user)}
                    title="Reset Password"
                  >
                    <i className="fas fa-key"></i> Reset
                  </button>

                  {/* View Details */}
                  <button
                    className="admin-btn admin-btn-view"
                    title="View Details"
                  >
                    <i className="fas fa-eye"></i> View
                  </button>

                  {/* Delete User */}
                  <button
                    className="admin-btn admin-btn-delete"
                    onClick={() => openDeleteModal(user)}
                    title="Delete User"
                  >
                    <i className="fas fa-trash"></i> Delete
                  </button>
                </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="admin-empty-state">
            <i className="fas fa-users"></i>
            <p>No users found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="admin-pagination">
          <button
            className="admin-pagination-btn"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          <span className="admin-pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            className="admin-pagination-btn"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>Confirm Delete</h3>
              <button 
                className="admin-modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="admin-modal-body">
              <p>Are you sure you want to delete user <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>?</p>
              <p className="admin-modal-warning">This action cannot be undone.</p>
            </div>
            <div className="admin-modal-footer">
              <button 
                className="admin-btn admin-btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="admin-btn admin-btn-danger"
                onClick={() => handleDeleteUser(selectedUser.id)}
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>Reset Password</h3>
              <button 
                className="admin-modal-close"
                onClick={() => setShowPasswordModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="admin-modal-body">
              <p>Reset password for <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong></p>
              <div className="admin-form-group">
                <label>New Password:</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  className="admin-form-input"
                  minLength="6"
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button 
                className="admin-btn admin-btn-secondary"
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                }}
              >
                Cancel
              </button>
              <button 
                className="admin-btn admin-btn-primary"
                onClick={handleResetPassword}
                disabled={!newPassword || newPassword.length < 6}
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserApproval;