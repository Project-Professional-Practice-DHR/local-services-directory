import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/Payment.css';

const Payment = () => {
  const { bookingReference } = useParams();
  const navigate = useNavigate();
  
  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(null);
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  
  // Card details
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: ''
  });
  
  // Form validation
  const [formErrors, setFormErrors] = useState({});
  
  // Fetch booking details based on booking reference
  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        
        // In a real app, you would fetch from your API
        // const response = await axios.get(`/api/bookings/reference/${bookingReference}`);
        // setBooking(response.data.data);
        
        // For demo, we'll use data from sessionStorage or mock data
        const bookingData = {
          id: sessionStorage.getItem('pendingBookingId') || '550e8400-e29b-41d4-a716-446655440000',
          reference: bookingReference,
          serviceName: sessionStorage.getItem('pendingBookingService') || 'Home Cleaning Service',
          date: sessionStorage.getItem('pendingBookingDate') || new Date().toISOString().split('T')[0],
          time: sessionStorage.getItem('pendingBookingTime') || '10:00 - 12:00',
          duration: sessionStorage.getItem('pendingBookingDuration') || 2,
          amount: parseFloat(sessionStorage.getItem('pendingBookingAmount')) || 99.99,
          status: 'pending_payment'
        };
        
        setBooking(bookingData);
        setError(null);
      } catch (err) {
        console.error('Error fetching booking details:', err);
        setError('Failed to load booking details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookingDetails();
  }, [bookingReference]);
  
  // Create payment intent when booking is loaded
  useEffect(() => {
    const createPaymentIntent = async () => {
      if (!booking || !booking.id) return;
      
      try {
    
        
        // In a real app, call your backend to create a payment intent
        // const response = await axios.post('/api/payments/create-intent', {
        //   bookingId: booking.id
        // }, {
        //   headers: {
        //     Authorization: `Bearer ${token}`
        //   }
        // });
        
        // For demo, simulate a payment intent
        const mockPaymentIntent = {
          clientSecret: 'mock_secret_' + Math.random().toString(36).substring(2, 15),
          paymentId: 'pi_' + Math.random().toString(36).substring(2, 15),
          amount: booking.amount,
          currency: 'gbp'
        };
        
        setPaymentIntent(mockPaymentIntent);
      } catch (err) {
        console.error('Error creating payment intent:', err);
        setError('Failed to initiate payment. Please try again.');
      }
    };
    
    createPaymentIntent();
  }, [booking]);
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for card number (format as user types)
    if (name === 'cardNumber') {
      // Remove non-digits
      const digitsOnly = value.replace(/\D/g, '');
      // Add spaces after every 4 digits
      const formatted = digitsOnly.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
      // Limit to 19 characters (16 digits + 3 spaces)
      const limited = formatted.substring(0, 19);
      
      setCardDetails(prev => ({
        ...prev,
        cardNumber: limited
      }));
    }
    // Special handling for expiry date (format as MM/YY)
    else if (name === 'expiryDate') {
      const digitsOnly = value.replace(/\D/g, '');
      let formatted = digitsOnly;
      
      if (digitsOnly.length > 2) {
        formatted = `${digitsOnly.substring(0, 2)}/${digitsOnly.substring(2, 4)}`;
      }
      
      setCardDetails(prev => ({
        ...prev,
        expiryDate: formatted
      }));
    }
    // Special handling for CVV (numbers only, max 4 digits)
    else if (name === 'cvv') {
      const digitsOnly = value.replace(/\D/g, '');
      setCardDetails(prev => ({
        ...prev,
        cvv: digitsOnly.substring(0, 4)
      }));
    }
    else {
      setCardDetails(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Validate the payment form
  const validateForm = () => {
    const errors = {};
    
    if (paymentMethod === 'card') {
      // Validate card details
      if (!cardDetails.cardNumber || cardDetails.cardNumber.replace(/\s/g, '').length < 16) {
        errors.cardNumber = 'Please enter a valid card number';
      }
      
      if (!cardDetails.expiryDate || cardDetails.expiryDate.length < 5) {
        errors.expiryDate = 'Please enter a valid expiry date';
      } else {
        // Check if the expiry date is valid
        const [month, year] = cardDetails.expiryDate.split('/');
        const currentYear = new Date().getFullYear() % 100;
        const currentMonth = new Date().getMonth() + 1;
        
        if (parseInt(month) < 1 || parseInt(month) > 12) {
            errors.expiryDate = 'Invalid month';
          } else if (parseInt(year) < currentYear) {
            errors.expiryDate = 'Card has expired';
          } else if (parseInt(year) === currentYear && parseInt(month) < currentMonth) {
            errors.expiryDate = 'Card has expired';
          }
      }
      
      if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
        errors.cvv = 'Please enter a valid security code';
      }
      
      if (!cardDetails.nameOnCard) {
        errors.nameOnCard = 'Please enter the name on card';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle payment submission
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsProcessing(true);
    setPaymentError(null);
    
    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real app, you would send the payment to Stripe or your payment processor
      // const paymentResult = await axios.post('/api/payments/confirm', {
      //   paymentIntentId: paymentIntent.paymentId,
      //   bookingId: booking.id
      // }, {
      //   headers: {
      //     Authorization: `Bearer ${localStorage.getItem('token')}`
      //   }
      // });
      
      // Simulate successful payment
      setPaymentSuccess(true);
      
      // Clear session storage
      sessionStorage.removeItem('pendingBookingId');
      sessionStorage.removeItem('pendingBookingService');
      sessionStorage.removeItem('pendingBookingDate');
      sessionStorage.removeItem('pendingBookingTime');
      sessionStorage.removeItem('pendingBookingDuration');
      sessionStorage.removeItem('pendingBookingAmount');
    } catch (err) {
      console.error('Payment processing error:', err);
      setPaymentError('Payment processing failed. Please try again or use a different payment method.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle payment method change
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    setFormErrors({});
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', { 
      style: 'currency', 
      currency: 'GBP' 
    }).format(amount);
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="payment-page">
        <div className="payment-loading">
          <div className="loading-spinner"></div>
          <p>Loading payment information...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="payment-page">
        <div className="payment-error">
          <h2>Payment Error</h2>
          <p>{error}</p>
          <button className="back-button" onClick={() => navigate('/booking/my-bookings,')}>
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }
  
  // Payment success state
  if (paymentSuccess) {
    return (
      <div className="payment-page">
        <div className="payment-success">
          <div className="success-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h2>Payment Successful!</h2>
          <p>Your payment for <strong>{booking.serviceName}</strong> has been processed successfully.</p>
          
          <div className="payment-receipt">
            <h3>Payment Receipt</h3>
            <div className="receipt-details">
              <div className="receipt-row">
                <span>Payment Reference:</span>
                <span>{paymentIntent?.paymentId || 'PAY-' + Math.floor(10000 + Math.random() * 90000)}</span>
              </div>
              <div className="receipt-row">
                <span>Booking Reference:</span>
                <span>{booking.reference}</span>
              </div>
              <div className="receipt-row">
                <span>Service:</span>
                <span>{booking.serviceName}</span>
              </div>
              <div className="receipt-row">
                <span>Date:</span>
                <span>{formatDate(booking.date)}</span>
              </div>
              <div className="receipt-row">
                <span>Time:</span>
                <span>{booking.time}</span>
              </div>
              <div className="receipt-row highlight">
                <span>Amount Paid:</span>
                <span>{formatCurrency(booking.amount)}</span>
              </div>
              <div className="receipt-row">
                <span>Payment Method:</span>
                <span>{paymentMethod === 'card' ? 'Credit/Debit Card' : 'PayPal'}</span>
              </div>
              <div className="receipt-row">
                <span>Payment Date:</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <div className="success-message">
            <p>A confirmation email with all details has been sent to your email address.</p>
            <p>Thank you for your booking!</p>
          </div>
          
          <div className="success-actions">
            <button className="view-booking-button" onClick={() => navigate('/profile/bookings')}>
              View My Bookings
            </button>
            <button className="home-button" onClick={() => navigate('/')}>
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="payment-page">
      <div className="payment-header">
        <h1>Complete Your Payment</h1>
        <p>Please provide your payment details to confirm your booking</p>
      </div>
      
      <div className="payment-content">
        <div className="payment-form-container">
          <form className="payment-form" onSubmit={handleSubmitPayment}>
            <h2>Payment Method</h2>
            <div className="payment-methods">
              <div 
                className={`payment-method ${paymentMethod === 'card' ? 'active' : ''}`}
                onClick={() => handlePaymentMethodChange('card')}
              >
                <div className="payment-method-icon card-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                  </svg>
                </div>
                <div className="payment-method-details">
                  <span className="payment-method-name">Credit/Debit Card</span>
                  <span className="payment-method-description">Visa, Mastercard, Amex</span>
                </div>
                <div className="payment-method-check">
                  {paymentMethod === 'card' && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
              </div>
              
              <div 
                className={`payment-method ${paymentMethod === 'paypal' ? 'active' : ''}`}
                onClick={() => handlePaymentMethodChange('paypal')}
              >
                <div className="payment-method-icon paypal-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H2L8 21H12L11 17H15L17 9H11L10 13H7L6 9Z"></path>
                    <path d="M14 4H20L16 14H10L14 4Z"></path>
                  </svg>
                </div>
                <div className="payment-method-details">
                  <span className="payment-method-name">PayPal</span>
                  <span className="payment-method-description">Pay securely with PayPal</span>
                </div>
                <div className="payment-method-check">
                  {paymentMethod === 'paypal' && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
              </div>
            </div>
            
            {paymentMethod === 'card' && (
              <div className="card-details">
                <div className="form-group">
                  <label htmlFor="nameOnCard">Name on Card</label>
                  <input
                    type="text"
                    id="nameOnCard"
                    name="nameOnCard"
                    value={cardDetails.nameOnCard}
                    onChange={handleInputChange}
                    placeholder="e.g. John Smith"
                    className={formErrors.nameOnCard ? 'error' : ''}
                  />
                  {formErrors.nameOnCard && (
                    <div className="error-message">{formErrors.nameOnCard}</div>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="cardNumber">Card Number</label>
                  <div className="card-number-input">
                    <input
                      type="text"
                      id="cardNumber"
                      name="cardNumber"
                      value={cardDetails.cardNumber}
                      onChange={handleInputChange}
                      placeholder="xxxx xxxx xxxx xxxx"
                      className={formErrors.cardNumber ? 'error' : ''}
                    />
                    <div className="card-icons">
                      <span className="card-icon visa"></span>
                      <span className="card-icon mastercard"></span>
                      <span className="card-icon amex"></span>
                    </div>
                  </div>
                  {formErrors.cardNumber && (
                    <div className="error-message">{formErrors.cardNumber}</div>
                  )}
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="expiryDate">Expiry Date</label>
                    <input
                      type="text"
                      id="expiryDate"
                      name="expiryDate"
                      value={cardDetails.expiryDate}
                      onChange={handleInputChange}
                      placeholder="MM/YY"
                      className={formErrors.expiryDate ? 'error' : ''}
                      maxLength="5"
                    />
                    {formErrors.expiryDate && (
                      <div className="error-message">{formErrors.expiryDate}</div>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="cvv">Security Code (CVV)</label>
                    <input
                      type="text"
                      id="cvv"
                      name="cvv"
                      value={cardDetails.cvv}
                      onChange={handleInputChange}
                      placeholder="123"
                      className={formErrors.cvv ? 'error' : ''}
                      maxLength="4"
                    />
                    {formErrors.cvv && (
                      <div className="error-message">{formErrors.cvv}</div>
                    )}
                  </div>
                </div>
                
                <div className="billing-address">
                  <h3>Billing Address</h3>
                  <div className="address-checkbox">
                    <input type="checkbox" id="sameAddress" defaultChecked />
                    <label htmlFor="sameAddress">Same as service address</label>
                  </div>
                </div>
              </div>
            )}
            
            {paymentMethod === 'paypal' && (
              <div className="paypal-info">
                <p>You will be redirected to PayPal to complete your payment securely.</p>
                <div className="paypal-logo">
                  <svg xmlns="http://www.w3.org/2000/svg" width="120" height="30" viewBox="0 0 124 33">
                    <path d="M46.211 6.749h-6.839a.95.95 0 0 0-.939.802l-2.766 17.537a.57.57 0 0 0 .564.658h3.265a.95.95 0 0 0 .939-.803l.746-4.73a.95.95 0 0 1 .938-.803h2.165c4.505 0 7.105-2.18 7.784-6.5.306-1.89.013-3.375-.872-4.415-.97-1.142-2.694-1.746-4.985-1.746zM47 13.154c-.374 2.454-2.249 2.454-4.062 2.454h-1.032l.724-4.583a.57.57 0 0 1 .563-.481h.473c1.235 0 2.4 0 3.002.704.359.42.469 1.044.332 1.906zM66.654 13.075h-3.275a.57.57 0 0 0-.563.481l-.145.916-.229-.332c-.709-1.029-2.29-1.373-3.868-1.373-3.619 0-6.71 2.741-7.312 6.586-.313 1.918.132 3.752 1.22 5.031.998 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .562.66h2.95a.95.95 0 0 0 .939-.803l1.77-11.209a.568.568 0 0 0-.561-.658zm-4.565 6.374c-.316 1.871-1.801 3.127-3.695 3.127-.951 0-1.711-.305-2.199-.883-.484-.574-.668-1.391-.514-2.301.295-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.499.589.697 1.411.554 2.317zM84.096 13.075h-3.291a.954.954 0 0 0-.787.417l-4.539 6.686-1.924-6.425a.953.953 0 0 0-.912-.678h-3.234a.57.57 0 0 0-.541.754l3.625 10.638-3.408 4.811a.57.57 0 0 0 .465.9h3.287a.949.949 0 0 0 .781-.408l10.946-15.8a.57.57 0 0 0-.468-.895z" fill="#253B80"/>
                    <path d="M94.992 6.749h-6.84a.95.95 0 0 0-.938.802l-2.766 17.537a.569.569 0 0 0 .562.658h3.51a.665.665 0 0 0 .656-.562l.785-4.971a.95.95 0 0 1 .938-.803h2.164c4.506 0 7.105-2.18 7.785-6.5.307-1.89.012-3.375-.873-4.415-.971-1.142-2.694-1.746-4.983-1.746zm.789 6.405c-.373 2.454-2.248 2.454-4.062 2.454h-1.031l.725-4.583a.568.568 0 0 1 .562-.481h.473c1.234 0 2.4 0 3.002.704.359.42.468 1.044.331 1.906zM115.434 13.075h-3.273a.567.567 0 0 0-.562.481l-.145.916-.23-.332c-.709-1.029-2.289-1.373-3.867-1.373-3.619 0-6.709 2.741-7.311 6.586-.312 1.918.131 3.752 1.219 5.031 1 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .564.66h2.949a.95.95 0 0 0 .938-.803l1.771-11.209a.571.571 0 0 0-.565-.658zm-4.565 6.374c-.314 1.871-1.801 3.127-3.695 3.127-.949 0-1.711-.305-2.199-.883-.484-.574-.666-1.391-.514-2.301.297-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.501.589.699 1.411.554 2.317zM119.295 7.23l-2.807 17.858a.569.569 0 0 0 .562.658h2.822c.469 0 .867-.34.939-.803l2.768-17.536a.57.57 0 0 0-.562-.659h-3.16a.571.571 0 0 0-.562.482z" fill="#179BD7"/>
                    <path d="M7.266 29.154l.523-3.322-1.165-.027H1.061L4.927 1.292a.316.316 0 0 1 .314-.268h9.38c3.114 0 5.263.648 6.385 1.927.526.6.861 1.227 1.023 1.917.17.724.173 1.589.007 2.644l-.012.077v.676l.526.298a3.69 3.69 0 0 1 1.065.812c.45.513.741 1.165.864 1.938.127.795.085 1.741-.123 2.812-.24 1.232-.628 2.305-1.152 3.183a6.547 6.547 0 0 1-1.825 2c-.696.494-1.523.869-2.458 1.109-.906.236-1.939.355-3.072.355h-.73c-.522 0-1.029.188-1.427.525a2.21 2.21 0 0 0-.744 1.328l-.055.299-.924 5.855-.042.215c-.011.068-.03.102-.058.125a.155.155 0 0 1-.096.035z" fill="#253B80"/>
                    <path d="M23.048 7.667c-.028.179-.06.362-.096.55-1.237 6.351-5.469 8.545-10.874 8.545H9.326c-.661 0-1.218.48-1.321 1.132L6.596 26.83l-.399 2.533a.704.704 0 0 0 .695.814h4.881c.578 0 1.069-.42 1.16-.99l.048-.248.919-5.832.059-.32c.09-.572.582-.992 1.16-.992h.73c4.729 0 8.431-1.92 9.513-7.476.452-2.321.218-4.259-.978-5.622a4.667 4.667 0 0 0-1.336-1.03z" fill="#179BD7"/>
                    <path d="M21.754 7.151a9.757 9.757 0 0 0-1.203-.267 15.284 15.284 0 0 0-2.426-.177h-7.352a1.172 1.172 0 0 0-1.159.992L8.05 17.605l-.045.289a1.336 1.336 0 0 1 1.321-1.132h2.752c5.405 0 9.637-2.195 10.874-8.545.037-.188.068-.371.096-.55a6.594 6.594 0 0 0-1.017-.429 9.045 9.045 0 0 0-.277-.087z" fill="#222D65"/>
                    <path d="M9.614 7.699a1.169 1.169 0 0 1 1.159-.991h7.352c.871 0 1.684.057 2.426.177a9.757 9.757 0 0 1 1.481.353c.365.121.704.264 1.017.429.368-2.347-.003-3.945-1.272-5.392C20.378.682 17.853 0 14.622 0h-9.38c-.66 0-1.223.48-1.325 1.133L.01 25.898a.806.806 0 0 0 .795.932h5.791l1.454-9.225z" fill="#253B80"/>
                  </svg>
                </div>
              </div>
            )}
            
            {/* Payment error message */}
            {paymentError && (
              <div className="payment-error-message">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{paymentError}</span>
              </div>
            )}
            
            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-button"
                onClick={() => navigate(`/bookings/${booking.id}`)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="pay-button"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    Pay {formatCurrency(booking?.amount || 0)}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        
        <div className="payment-summary">
          <div className="booking-summary">
            <h2>Booking Summary</h2>
            <div className="summary-details">
              <div className="summary-item">
                <span>Service:</span>
                <span>{booking?.serviceName}</span>
              </div>
              <div className="summary-item">
                <span>Booking Reference:</span>
                <span>{booking?.reference}</span>
              </div>
              <div className="summary-item">
                <span>Date:</span>
                <span>{formatDate(booking?.date)}</span>
              </div>
              <div className="summary-item">
                <span>Time:</span>
                <span>{booking?.time}</span>
              </div>
              <div className="summary-item">
                <span>Duration:</span>
                <span>{booking?.duration} {booking?.duration === 1 ? 'hour' : 'hours'}</span>
              </div>
              <div className="summary-item total">
                <span>Total:</span>
                <span>{formatCurrency(booking?.amount || 0)}</span>
              </div>
            </div>
          </div>
          
          <div className="payment-security-info">
            <div className="security-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <h3>Secure Payment</h3>
            </div>
            <p>All transactions are secure and encrypted. Your payment details are never stored on our servers.</p>
            <div className="payment-icons">
              <span className="payment-icon visa"></span>
              <span className="payment-icon mastercard"></span>
              <span className="payment-icon amex"></span>
              <span className="payment-icon paypal"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;