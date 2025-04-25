import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CreditCard, CheckCircle, Clock, AlertCircle, ArrowLeft, Users, Film, Popcorn } from 'lucide-react';
import bookingService from '../../../../../services/bookingService';
import paymentService from '../../../../../services/paymentService';
import movieService from '../../../../../services/movieService';
import './Payment.css';

const Payment = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [movieDetails, setMovieDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState({
    status: null, // 'success', 'error', 'processing'
    message: ''
  });
  
  // Fetch booking details and load Razorpay
  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        const response = await bookingService.getBookingById(bookingId);
        setBooking(response);
        
        // Optionally fetch movie details if needed
        try {
          if (response.movieId) {
            // Use the movieService instead of direct fetch
            const movieData = await movieService.getMovieById(response.movieId);
            setMovieDetails(movieData);
          }
        } catch (err) {
          console.error("Error fetching movie details:", err);
          // Continue even if movie details can't be fetched
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching booking details:", err);
        setError("Failed to load booking information. Please try again.");
        setLoading(false);
        toast.error("Failed to load booking information");
      }
    };
    
    fetchBookingDetails();
    
    // Load Razorpay script
    const loadRazorpay = () => {
      if (window.Razorpay) {
        setRazorpayLoaded(true);
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => setRazorpayLoaded(true);
      script.onerror = () => {
        console.error("Failed to load Razorpay script");
        toast.error("Payment gateway failed to load. Please refresh the page.");
      };
      document.body.appendChild(script);
    };
    
    loadRazorpay();
    
    // Set a timer to check if the payment is not completed
    const timer = setTimeout(() => {
      if (booking && booking.status === 'PAYMENT_PENDING') {
        toast.warning('Your booking will expire in a few minutes if payment is not completed.');
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => {
      clearTimeout(timer);
    };
  }, [bookingId]);
  
  // Calculate fees and total amount
  const calculateFees = () => {
    if (!booking) return { subtotal: 0, convenienceFee: 0, discount: 0, total: 0 };
    
    // Get base amount from booking
    const subtotal = booking.subtotalAmount || 0;
    
    // Calculate fees - use the actual ones from booking if available
    const convenienceFee = booking.additionalCharges || (subtotal * 0.025); // 2.5% convenience fee
    const discount = booking.appliedCoupon?.discount || 0; // Use discount if there's a coupon
    
    // Get total from booking or calculate
    const total = booking.totalAmount || (subtotal + convenienceFee - discount);
    
    return {
      subtotal,
      convenienceFee,
      discount,
      total
    };
  };
  
  // Handle payment initialization
  const handlePayment = async () => {
    if (!razorpayLoaded) {
      toast.error("Payment gateway is not ready. Please refresh the page and try again.");
      return;
    }
    
    try {
      setProcessingPayment(true);
      setPaymentStatus({
        status: 'processing',
        message: 'Processing your payment request...'
      });
      
      // Calculate total amount
      const { total } = calculateFees();
      
      // Log debugging information
      console.log('Payment details:', {
        bookingId,
        amount: total,
        currency: 'INR'
      });
      
      // Initialize payment with backend
      const paymentResponse = await paymentService.initiateBookingPayment(
        bookingId, 
        total,
        'INR'
      );
      
      console.log('Payment response:', paymentResponse);
      
      if (!paymentResponse || !paymentResponse.orderId) {
        throw new Error('Failed to create payment order. Please try again.');
      }
      
      // Configure Razorpay options
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || paymentResponse.key || 'rzp_test_key',
        amount: Math.round(total * 100), // Convert to paise/cents
        currency: 'INR',
        name: 'MovieBuff',
        description: `Tickets for ${booking.movieTitle}`,
        order_id: paymentResponse.orderId,
        handler: function(response) {
          // Ensure all required fields are included in the verification request
          const verificationData = {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            bookingId: bookingId
          };
          
          // Check that all required fields are present
          if (!verificationData.razorpayOrderId || !verificationData.razorpayPaymentId || !verificationData.razorpaySignature) {
            setPaymentStatus({
              status: 'error',
              message: 'Payment verification failed: Missing payment information from gateway.'
            });
            setProcessingPayment(false);
            return;
          }
          
          setPaymentStatus({
            status: 'processing',
            message: 'Verifying payment...'
          });
          
          // Verify payment
          handlePaymentVerification(verificationData);
        },
        prefill: {
          name: localStorage.getItem('userName') || 'Customer',
          email: localStorage.getItem('userEmail') || '',
          contact: localStorage.getItem('userPhone') || ''
        },
        theme: {
          color: '#0f766e'
        },
        modal: {
          ondismiss: function() {
            setPaymentStatus({
              status: 'error',
              message: `Payment was canceled. Please try again when you're ready.`
            });
            setProcessingPayment(false);
          }
        }
      };
      
      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function(response) {
        setPaymentStatus({
          status: 'error',
          message: `Payment failed: ${response.error.description || 'An error occurred during payment processing.'}`
        });
        setProcessingPayment(false);
      });
      
      razorpay.open();
      
    } catch (err) {
      console.error("Error initiating payment:", err);
      setPaymentStatus({
        status: 'error',
        message: err.message || 'Failed to initialize payment. Please try again.'
      });
      setProcessingPayment(false);
      toast.error(err.message || 'Failed to initialize payment. Please try again.');
    }
  };
  
  // Handle payment verification
  const handlePaymentVerification = async (paymentData) => {
    try {
      // Verify and finalize payment
      const response = await paymentService.verifyBookingPayment(paymentData);
      
      setProcessingPayment(false);
      setPaymentStatus({
        status: 'success',
        message: 'Payment successful! Redirecting to confirmation...'
      });
      
      // Show success message
      toast.success("Payment successful! Your tickets are being processed...");
      
      // Redirect to confirmation page
      setTimeout(() => {
        navigate(`/booking-confirmed/${bookingId}`);
      }, 2000);
      
    } catch (err) {
      console.error("Error verifying payment:", err);
      setPaymentStatus({
        status: 'error',
        message: err.message || 'Payment verification failed. Please contact support.'
      });
      setProcessingPayment(false);
      toast.error(err.message || 'Payment verification failed. Please contact support.');
    }
  };
  
  // Handle going back to seat selection
  const handleBackToSeats = () => {
    navigate(`/booking/${booking.showId}`);
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      weekday: 'short',
      day: 'numeric', 
      month: 'short', 
      year: 'numeric'
    });
  };
  
  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };
  
  // Render payment status alert
  const renderPaymentStatusAlert = () => {
    if (!paymentStatus.status) return null;
    
    let className = "";
    let icon = null;
    
    switch (paymentStatus.status) {
      case 'success':
        className = "alert alert-success";
        icon = <CheckCircle size={18} className="me-2" />;
        break;
      case 'error':
        className = "alert alert-danger";
        icon = <AlertCircle size={18} className="me-2" />;
        break;
      case 'processing':
        className = "alert alert-info";
        icon = <div className="spinner-border spinner-border-sm me-2" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>;
        break;
      default:
        className = "alert alert-secondary";
        icon = null;
    }
    
    return (
      <div className={className} role="alert">
        <div className="d-flex align-items-center">
          {icon}
          <div>{paymentStatus.message}</div>
        </div>
      </div>
    );
  };
  
  // Show loading state
  if (loading) {
    return (
      <div className="container my-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading payment details...</p>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="container my-5 text-center">
        <div className="alert alert-danger">
          <AlertCircle size={24} className="mb-3" />
          <p className="mb-3">{error}</p>
          <button className="btn btn-outline-danger" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  // If booking not found
  if (!booking) {
    return (
      <div className="container my-5 text-center">
        <div className="alert alert-warning">
          <AlertCircle size={24} className="mb-3" />
          <p className="mb-3">Booking not found or has expired. Please try booking again.</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }
  
  // Calculate fees
  const { subtotal, convenienceFee, discount, total } = calculateFees();
  
  return (
    <div className="payment-container container py-4">
      {renderPaymentStatusAlert()}
      
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="text-center mb-1">Complete Your Payment</h2>
          <p className="text-center text-muted">
            You have 10 minutes to complete this transaction
          </p>
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-7 mb-4">
          <div className="booking-details-card">
            <h3>Booking Details</h3>
            
            <div className="movie-details">
              <h4>{booking.movieTitle}</h4>
              <div className="d-flex align-items-center mb-2">
                <span className="badge bg-info me-2">{booking.experience}</span>
                <span className="badge bg-secondary">{booking.language}</span>
              </div>
              <p className="text-muted mb-1">
                <Film size={16} className="me-1" />
                {booking.theaterName} • Screen {booking.screenNumber}
              </p>
              <p className="show-time">
                <Clock size={16} />
                <span>{formatDate(booking.showTime)} • {formatTime(booking.showTime)}</span>
              </p>
            </div>
            
            <div className="ticket-details">
              <div className="detail-row">
                <span>Selected Seats:</span>
                <span className="value">
                  {booking.seats && booking.seats.map ? 
                    booking.seats.map(seat => seat.seatId).join(', ') : 
                    'N/A'}
                </span>
              </div>
              
              <div className="detail-row">
                <span>Number of Tickets:</span>
                <span className="value">
                  <Users size={14} className="me-1" />
                  {booking.seats && booking.seats.length || 0}
                </span>
              </div>
              
              <div className="detail-row">
                <span>Seat Categories:</span>
                <span className="value">
                  {booking.seats && booking.seats.map ? 
                    [...new Set(booking.seats.map(seat => seat.category))].join(', ') : 
                    'N/A'}
                </span>
              </div>
              
              <div className="detail-row">
                <span>Booking Number:</span>
                <span className="value">{booking.bookingNumber || 'N/A'}</span>
              </div>
              
              <div className="detail-row">
                <span>Amenities:</span>
                <span className="value">
                  <Popcorn size={14} className="me-1" />
                  Food & Beverages Available
                </span>
              </div>
            </div>
          </div>
          
          <button className="btn-back mt-3" onClick={handleBackToSeats}>
            <ArrowLeft size={16} />
            Back to Seat Selection
          </button>
        </div>
        
        <div className="col-md-5">
          <div className="payment-summary-card">
            <h3>Payment Summary</h3>
            
            <div className="amount-row">
              <span>Base Price ({booking.seats && booking.seats.length || 0} tickets)</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            
            <div className="amount-row">
              <span>Convenience Fee</span>
              <span>{formatCurrency(convenienceFee)}</span>
            </div>
            
            {discount > 0 && (
              <div className="amount-row">
                <span>Discount</span>
                <span>- {formatCurrency(discount)}</span>
              </div>
            )}
            
            <div className="amount-row total">
              <span>Total Amount</span>
              <span>{formatCurrency(total)}</span>
            </div>
            
            <button 
              className="btn-payment"
              onClick={handlePayment}
              disabled={processingPayment || !razorpayLoaded}
            >
              {processingPayment ? (
                <>
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Processing...</span>
                  </div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  <span>Pay {formatCurrency(total)}</span>
                </>
              )}
            </button>
            
            <div className="payment-methods">
              <p>Supported Payment Methods:</p>
              <div className="method-icons">
                <span className="method-icon credit-card">Credit Card</span>
                <span className="method-icon debit-card">Debit Card</span>
                <span className="method-icon netbanking">Net Banking</span>
                <span className="method-icon upi">UPI</span>
              </div>
            </div>
            
            <div className="security-note">
              <p>
                <CheckCircle size={16} />
                <span>Your transaction is secure and encrypted</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;