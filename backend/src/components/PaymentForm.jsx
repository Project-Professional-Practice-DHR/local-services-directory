// src/components/PaymentForm.jsx
import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';

const PaymentForm = ({ bookingId, amount, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentId, setPaymentId] = useState(null);
  const [error, setError] = useState(null);
  
  const stripe = useStripe();
  const elements = useElements();
  
  useEffect(() => {
    const fetchPaymentIntent = async () => {
      try {
        const response = await axios.post('/api/payments/create-intent', {
          bookingId
        });
        
        if (response.data.success) {
          setClientSecret(response.data.clientSecret);
          setPaymentId(response.data.paymentId);
        } else {
          setError(response.data.message);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to initialize payment');
      }
    };
    
    fetchPaymentIntent();
  }, [bookingId]);
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const cardElement = elements.getElement(CardElement);
    
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          // You can add billing details here if needed
        }
      }
    });
    
    if (error) {
      setError(error.message);
      setLoading(false);
      if (onError) onError(error);
    } else if (paymentIntent.status === 'succeeded') {
      // Notify your backend about successful payment
      try {
        const response = await axios.post('/api/payments/confirm', {
          paymentIntentId: paymentIntent.id
        });
        
        if (response.data.success) {
          if (onSuccess) onSuccess(response.data.payment);
        } else {
          setError('Payment confirmed but server update failed');
          if (onError) onError(new Error('Payment confirmed but server update failed'));
        }
      } catch (err) {
        setError('Payment successful but confirmation failed');
        if (onError) onError(err);
      }
    }
    
    setLoading(false);
  };
  
  return (
    <div className="payment-form-container">
      <h3>Complete Your Payment</h3>
      <p className="amount-display">Amount: ${amount.toFixed(2)}</p>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Card Details</label>
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || !stripe || !clientSecret}
          className="payment-button"
        >
          {loading ? 'Processing...' : 'Pay Now'}
        </button>
      </form>
    </div>
  );
};

export default PaymentForm;