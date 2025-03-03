// src/components/PaymentHistory.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatDate } from '../utils/dateUtils'; // Assume you have a date formatting utility

const PaymentHistory = ({ userId, userType }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        // Endpoint would depend on whether this is for a customer or provider
        const endpoint = userType === 'provider' 
          ? '/api/payments/provider-history' 
          : '/api/payments/customer-history';
          
        const response = await axios.get(endpoint);
        
        if (response.data.success) {
          setPayments(response.data.payments);
        } else {
          setError(response.data.message);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load payment history');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPayments();
  }, [userId, userType]);
  
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'completed':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'failed':
        return 'badge-danger';
      case 'refunded':
        return 'badge-info';
      default:
        return 'badge-secondary';
    }
  };
  
  if (loading) {
    return <div>Loading payment history...</div>;
  }
  
  if (error) {
    return <div>Error: {error}</div>;
  }
  
  if (payments.length === 0) {
    return <div>No payment history found.</div>;
  }
  
  return (
    <div className="payment-history">
      <h3>Payment History</h3>
      
      <table className="payment-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Date</th>
            <th>Service</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {payments.map(payment => (
            <tr key={payment.id}>
              <td>{payment.id}</td>
              <td>{formatDate(payment.createdAt)}</td>
              <td>{payment.Booking.serviceName}</td>
              <td>${payment.amount.toFixed(2)}</td>
              <td>
                <span className={`status-badge ${getStatusBadgeClass(payment.paymentStatus)}`}>
                  {payment.paymentStatus}
                </span>
              </td>
              <td>
                <button 
                  onClick={() => window.location.href = `/payments/${payment.id}`}
                  className="btn-view"
                >
                  View Details
                </button>
                
                {/* Show refund button only for service providers and completed payments */}
                {userType === 'provider' && payment.paymentStatus === 'completed' && !payment.refundStatus && (
                  <button 
                    onClick={() => window.location.href = `/payments/${payment.id}/refund`}
                    className="btn-refund"
                  >
                    Process Refund
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentHistory;