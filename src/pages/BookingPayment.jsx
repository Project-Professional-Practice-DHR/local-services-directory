// src/pages/BookingPayment.jsx
import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentForm from '../components/PaymentForm';
import { useParams, useNavigate } from 'react-router-dom';
import { useBooking } from '../hooks/useBooking'; // Assume you have a custom hook for fetching booking details

// Load stripe outside of component to avoid recreating the Stripe object on every render
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const BookingPayment = () => {
  const { bookingId } = useParams();
  const { booking, isLoading, error } = useBooking(bookingId);
  const navigate = useNavigate();
  
  const handlePaymentSuccess = (payment) => {
    // Show success message
    alert('Payment successful!');
    // Redirect to booking details
    navigate(`/bookings/${bookingId}`);
  };
  
  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    // Error handling is done in the PaymentForm component
  };
  
  if (isLoading) {
    return <div>Loading booking details...</div>;
  }
  
  if (error) {
    return <div>Error loading booking: {error.message}</div>;
  }
  
  if (!booking) {
    return <div>Booking not found</div>;
  }
  
  return (
    <div className="booking-payment-page">
      <h2>Payment for Booking #{bookingId}</h2>
      
      <div className="booking-summary">
        <h3>Booking Summary</h3>
        <p><strong>Service:</strong> {booking.serviceName}</p>
        <p><strong>Provider:</strong> {booking.ServiceProviderProfile.businessName}</p>
        <p><strong>Date & Time:</strong> {new Date(booking.startTime).toLocaleString()}</p>
        <p><strong>Duration:</strong> {booking.duration} minutes</p>
        <p><strong>Total Amount:</strong> ${booking.price.toFixed(2)}</p>
      </div>
      
      <div className="payment-section">
        <Elements stripe={stripePromise}>
          <PaymentForm 
            bookingId={bookingId}
            amount={booking.price}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </Elements>
      </div>
    </div>
  );
};

export default BookingPayment;