import { useState, useEffect } from 'react';
import '../../styles/BookingOverview.css';

const BookingOverview = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Use relative path instead of environment variable
  const API_BASE = '/api';

  useEffect(() => {
    fetchBookings();
  }, [filter, dateRange, searchTerm, currentPage]);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      setError(null); // Clear previous errors
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      
      if (!token) {
        setError('Authentication token not found');
        return;
      }
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(filter !== 'all' && { status: filter }),
        ...(searchTerm && { search: searchTerm }),
        dateRange: dateRange
      });
      
      const url = `${API_BASE}/booking?${params}`;
      console.log('Fetching bookings from:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Token used for API call:', token);
      console.log('Bookings API Response status:', response.status);

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
      console.log('Bookings data received:', data);
      
      // Handle different response structures
      if (data.success) {
        setBookings(data.bookings || data.data || []);
        setTotalPages(data.totalPages || 1);
      } else if (Array.isArray(data)) {
        setBookings(data);
      } else {
        setBookings(data.bookings || data.data || []);
        setTotalPages(data.totalPages || 1);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(`Failed to load bookings: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      
      const response = await fetch(`${API_BASE}/booking/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update the booking in the list
      setBookings(bookings.map(booking => 
        booking.id === bookingId ? { ...booking, status: newStatus } : booking
      ));
      
      setError(null);
      
    } catch (err) {
      console.error('Error updating booking status:', err);
      setError(`Failed to update booking status: ${err.message}`);
    }
  };

  const handleBookingAction = async (bookingId, action) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      
      const response = await fetch(`${API_BASE}/booking/${bookingId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh bookings list
      fetchBookings();
      setError(null);
      
    } catch (err) {
      console.error(`Error performing ${action} on booking:`, err);
      setError(`Failed to ${action} booking: ${err.message}`);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'admin-badge admin-badge-warning',
      confirmed: 'admin-badge admin-badge-info',
      in_progress: 'admin-badge admin-badge-primary',
      completed: 'admin-badge admin-badge-success',
      cancelled: 'admin-badge admin-badge-danger',
      refunded: 'admin-badge admin-badge-secondary'
    };
    
    return (
      <span className={statusClasses[status] || 'admin-badge'}>
        {status?.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  // Calculate simple stats from current bookings data
  const getDisplayStats = () => {
    const totalBookings = bookings.length;
    const pendingBookings = bookings.filter(b => b.status === 'pending').length;
    const completedBookings = bookings.filter(b => b.status === 'completed').length;
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
    const totalRevenue = bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.totalAmount || b.price || 0), 0);

    return {
      totalBookings,
      pendingBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue
    };
  };

  const stats = getDisplayStats();

  if (isLoading && bookings.length === 0) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="admin-booking-overview">
      {/* Stats Cards - Based on Current Page Data */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <i className="fas fa-calendar-check"></i>
          </div>
          <div className="admin-stat-content">
            <h3>{stats.totalBookings}</h3>
            <p>Current Page Bookings</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="admin-stat-content">
            <h3>{stats.pendingBookings}</h3>
            <p>Pending Bookings</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="admin-stat-content">
            <h3>{stats.completedBookings}</h3>
            <p>Completed Bookings</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="admin-filters-section">
        <div className="admin-filters-row">
          <div className="admin-search-group">
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="admin-search-input"
            />
            <i className="fas fa-search admin-search-icon"></i>
          </div>

          <select 
            value={filter} 
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="admin-select"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select 
            value={dateRange} 
            onChange={(e) => {
              setDateRange(e.target.value);
              setCurrentPage(1);
            }}
            className="admin-select"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="admin-error-message">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
          <button 
            className="admin-btn admin-btn-sm" 
            onClick={() => fetchBookings()}
            style={{ marginLeft: '10px' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Bookings Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Customer</th>
              <th>Service</th>
              <th>Provider</th>
              <th>Date & Time</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(booking => (
              <tr key={booking.id}>
                <td>
                  <span className="booking-id">#{booking.id}</span>
                </td>
                <td>
                  <div className="customer-info">
                    <strong>{booking.customerName || `${booking.customer?.firstName} ${booking.customer?.lastName}`}</strong>
                    <span>{booking.customer?.email}</span>
                  </div>
                </td>
                <td>
                  <div className="service-info">
                    <strong>{booking.serviceName || booking.service?.name}</strong>
                    <span>{booking.service?.category}</span>
                  </div>
                </td>
                <td>
                  <div className="provider-info">
                    <strong>{booking.providerName || `${booking.provider?.firstName} ${booking.provider?.lastName}`}</strong>
                    <span>{booking.provider?.businessName}</span>
                  </div>
                </td>
                <td>
                  <div className="booking-datetime">
                    <strong>{formatDate(booking.scheduledDate || booking.date)}</strong>
                    <span>{booking.scheduledTime || booking.time}</span>
                  </div>
                </td>
                <td>
                  <strong className="booking-amount">{formatCurrency(booking.totalAmount || booking.price)}</strong>
                </td>
                <td>
                  {getStatusBadge(booking.status)}
                </td>
                <td>
                  <div className="admin-action-buttons">
                    <button
                      className="admin-btn admin-btn-sm"
                      onClick={() => handleViewDetails(booking)}
                      title="View Details"
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    
                    {booking.status === 'pending' && (
                      <>
                        <button
                          className="admin-btn admin-btn-sm admin-btn-success"
                          onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                          title="Confirm Booking"
                        >
                          <i className="fas fa-check"></i>
                        </button>
                        <button
                          className="admin-btn admin-btn-sm admin-btn-danger"
                          onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                          title="Cancel Booking"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </>
                    )}
                    
                    {booking.status === 'confirmed' && (
                      <button
                        className="admin-btn admin-btn-sm admin-btn-primary"
                        onClick={() => handleStatusUpdate(booking.id, 'in_progress')}
                        title="Mark In Progress"
                      >
                        <i className="fas fa-play"></i>
                      </button>
                    )}
                    
                    {booking.status === 'in_progress' && (
                      <button
                        className="admin-btn admin-btn-sm admin-btn-success"
                        onClick={() => handleStatusUpdate(booking.id, 'completed')}
                        title="Mark Completed"
                      >
                        <i className="fas fa-check-circle"></i>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {bookings.length === 0 && !isLoading && (
          <div className="admin-empty-state">
            <i className="fas fa-calendar-times"></i>
            <p>No bookings found</p>
            {searchTerm && (
              <p>Try adjusting your search terms or filters</p>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="admin-pagination">
          <button
            className="admin-btn admin-btn-secondary"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <i className="fas fa-chevron-left"></i> Previous
          </button>
          
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            className="admin-btn admin-btn-secondary"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-modal-large">
            <div className="admin-modal-header">
              <h3>Booking Details - #{selectedBooking.id}</h3>
              <button
                className="admin-modal-close"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedBooking(null);
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="admin-modal-body">
              <div className="booking-details-grid">
                <div className="detail-section">
                  <h4>Customer Information</h4>
                  <div className="detail-item">
                    <label>Name:</label>
                    <span>{selectedBooking.customerName || `${selectedBooking.customer?.firstName} ${selectedBooking.customer?.lastName}`}</span>
                  </div>
                  <div className="detail-item">
                    <label>Email:</label>
                    <span>{selectedBooking.customer?.email}</span>
                  </div>
                  <div className="detail-item">
                    <label>Phone:</label>
                    <span>{selectedBooking.customer?.phone}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Service Details</h4>
                  <div className="detail-item">
                    <label>Service:</label>
                    <span>{selectedBooking.serviceName || selectedBooking.service?.name}</span>
                  </div>
                  <div className="detail-item">
                    <label>Category:</label>
                    <span>{selectedBooking.service?.category}</span>
                  </div>
                  <div className="detail-item">
                    <label>Duration:</label>
                    <span>{selectedBooking.service?.duration} minutes</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Provider Information</h4>
                  <div className="detail-item">
                    <label>Name:</label>
                    <span>{selectedBooking.providerName || `${selectedBooking.provider?.firstName} ${selectedBooking.provider?.lastName}`}</span>
                  </div>
                  <div className="detail-item">
                    <label>Business:</label>
                    <span>{selectedBooking.provider?.businessName}</span>
                  </div>
                  <div className="detail-item">
                    <label>Email:</label>
                    <span>{selectedBooking.provider?.email}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Booking Information</h4>
                  <div className="detail-item">
                    <label>Date:</label>
                    <span>{formatDate(selectedBooking.scheduledDate || selectedBooking.date)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Time:</label>
                    <span>{selectedBooking.scheduledTime || selectedBooking.time}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status:</label>
                    <span>{getStatusBadge(selectedBooking.status)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Amount:</label>
                    <span className="booking-amount-large">{formatCurrency(selectedBooking.totalAmount || selectedBooking.price)}</span>
                  </div>
                  {selectedBooking.notes && (
                    <div className="detail-item">
                      <label>Notes:</label>
                      <span>{selectedBooking.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="admin-modal-footer">
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedBooking(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingOverview;