import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  CreditCard, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ArrowLeft, 
  Users, 
  Monitor, 
  Popcorn,
  Ticket,
  CreditCard as CardIcon,
  Smartphone,
  Building,
  FileText,
  Lock,
  DollarSign,
  Plus,
  Percent,
  Tag
} from 'lucide-react';
import bookingService from '../../../../../services/bookingService';
import paymentService from '../../../../../services/paymentService';
import movieService from '../../../../../services/movieService';
import showService from '../../../../../services/showService';
import './Payment.css';

const Payment = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [booking, setBooking] = useState(null);
  const [show, setShow] = useState(null);
  const [movieDetails, setMovieDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState({
    status: null, // 'success', 'error', 'processing'
    message: ''
  });
  const [priceBreakdown, setPriceBreakdown] = useState({
    subtotal: 0,
    additionalCharges: {},
    totalAdditionalAmount: 0,
    discount: 0,
    total: 0
  });
  
  // Fetch booking details and load Razorpay
  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        const response = await bookingService.getBookingById(bookingId);
        setBooking(response);
        
        // Fetch show details to get pricing structure
        if (response.showId) {
          try {
            const showData = await showService.getShow(response.showId);
            setShow(showData);
            
            // Calculate price breakdown once we have both booking and show data
            calculatePriceBreakdown(response, showData);
          } catch (err) {
            console.error("Error fetching show details:", err);
            // Continue even if show details can't be fetched
          }
        }
        
        // Optionally fetch movie details if needed
        try {
          if (response.movieId) {
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

  // Calculate price breakdown based on booking and show data
  const calculatePriceBreakdown = (bookingData, showData) => {
    if (!bookingData || !bookingData.seats || bookingData.seats.length === 0 || !showData || !showData.pricing) {
      return;
    }
    
    let subtotal = 0;
    const additionalCharges = {};
    let totalAdditionalAmount = 0;
    
    // Process each seat
    bookingData.seats.forEach(seat => {
      // Add base price to subtotal
      subtotal += seat.basePrice || 0;
      
      // Process additional charges for this seat
      const pricing = showData.pricing[seat.category];
      if (pricing && pricing.additionalCharges) {
        pricing.additionalCharges.forEach(charge => {
          let chargeAmount = 0;
          
          if (charge.isPercentage) {
            // Calculate percentage of base price
            chargeAmount = (seat.basePrice || 0) * (charge.amount / 100);
          } else {
            // Fixed charge
            chargeAmount = charge.amount;
          }
          
          // Add to appropriate charge type in our breakdown
          if (!additionalCharges[charge.type]) {
            additionalCharges[charge.type] = {
              amount: 0,
              isPercentage: charge.isPercentage,
              originalAmount: charge.amount
            };
          }
          additionalCharges[charge.type].amount += chargeAmount;
          totalAdditionalAmount += chargeAmount;
        });
      }
    });
    
    // Get discount from booking if there's a coupon
    const discount = bookingData.appliedCoupon?.discount || 0;
    
    // Calculate total
    const total = subtotal + totalAdditionalAmount - discount;
    
    // Update state with calculated breakdown
    setPriceBreakdown({
      subtotal,
      additionalCharges,
      totalAdditionalAmount,
      discount,
      total
    });
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
      
      // Initialize payment with backend
      const paymentResponse = await paymentService.initiateBookingPayment(
        bookingId, 
        priceBreakdown.total,
        'INR'
      );
      
      if (!paymentResponse || !paymentResponse.orderId) {
        throw new Error('Failed to create payment order. Please try again.');
      }
      
      // Configure Razorpay options
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || paymentResponse.key || 'rzp_test_key',
        amount: Math.round(priceBreakdown.total * 100), // Convert to paise/cents
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
        navigate(`/customer/booking-confirmed/${bookingId}`);
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
      month: 'short'
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
        icon = <CheckCircle size={18} />;
        break;
      case 'error':
        className = "alert alert-danger";
        icon = <AlertCircle size={18} />;
        break;
      case 'processing':
        className = "alert alert-info";
        icon = <div className="spinner-border spinner-border-sm" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>;
        break;
      default:
        className = "alert alert-secondary";
        icon = null;
    }
    
    return (
      <div className={className} role="alert">
        <div className="d-flex align-items-center gap-2">
          {icon}
          <div>{paymentStatus.message}</div>
        </div>
      </div>
    );
  };
  
  // Show loading state
  if (loading) {
    return (
      <div className="payment-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading payment details...</p>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="payment-container">
        <div className="error-container">
          <AlertCircle size={32} />
          <h4>Error</h4>
          <p>{error}</p>
          <button className="btn-back" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  // If booking not found
  if (!booking) {
    return (
      <div className="payment-container">
        <div className="error-container">
          <AlertCircle size={32} />
          <h4>Booking Not Found</h4>
          <p>Booking not found or has expired. Please try booking again.</p>
          <button className="btn-back" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="payment-container">
      {renderPaymentStatusAlert()}
      
      <div className="payment-header">
        <h2>Complete Your Payment</h2>
        <p>
          <Clock size={16} />
          <span>You have 10 minutes to complete this transaction</span>
        </p>
      </div>
      
      <div className="container">
        <div className="row">
          <div className="col-md-7 mb-4">
            <div className="booking-details-card">
              <h3>
                <Ticket size={18} />
                <span>Booking Details</span>
              </h3>
              
              <div className="movie-details">
                <h4>{booking.movieTitle}</h4>
                <div className="badges">
                  <span className="badge bg-info">{booking.experience}</span>
                  <span className="badge bg-secondary">{booking.language}</span>
                </div>
                <div className="theater-info">
                  <Monitor size={16} />
                  <span>{booking.theaterName} • Screen {booking.screenNumber}</span>
                </div>
                <div className="show-time">
                  <Clock size={16} />
                  <span>{formatDate(booking.showTime)} • {formatTime(booking.showTime)}</span>
                </div>
              </div>
              
              <div className="ticket-details">
                <div className="detail-row">
                  <span>Selected Seats</span>
                  <span className="value">
                    {booking.seats && booking.seats.map ? 
                      booking.seats.map(seat => seat.seatId).join(', ') : 
                      'N/A'}
                  </span>
                </div>
                
                <div className="detail-row">
                  <span>Number of Tickets</span>
                  <span className="value">
                    <Users size={14} />
                    <span>{booking.seats && booking.seats.length || 0}</span>
                  </span>
                </div>
                
                <div className="detail-row">
                  <span>Seat Categories</span>
                  <span className="value">
                    {booking.seats && booking.seats.map ? 
                      [...new Set(booking.seats.map(seat => seat.category))].join(', ') : 
                      'N/A'}
                  </span>
                </div>
                
                <div className="detail-row">
                  <span>Booking Number</span>
                  <span className="value">{booking.bookingNumber || 'N/A'}</span>
                </div>
                
                <div className="detail-row">
                  <span>Amenities</span>
                  <span className="value">
                    <Popcorn size={14} />
                    <span>Food & Beverages Available</span>
                  </span>
                </div>
              </div>
            </div>
            
            <button className="btn-back mt-3" onClick={handleBackToSeats}>
              <ArrowLeft size={16} />
              <span>Back to Seat Selection</span>
            </button>
          </div>
          
          <div className="col-md-5">
            <div className="payment-summary-card">
              <h3>
                <DollarSign size={18} />
                <span>Payment Summary</span>
              </h3>
              
              <div className="amount-row">
                <span>Base Price ({booking.seats && booking.seats.length || 0} tickets)</span>
                <span>{formatCurrency(priceBreakdown.subtotal)}</span>
              </div>
              
              {/* Additional Charges */}
              {Object.entries(priceBreakdown.additionalCharges).length > 0 && (
                <div className="additional-charges-section">
                  <div className="additional-charges-header">
                    <Tag size={14} />
                    <span>Additional Charges</span>
                  </div>
                  
                  {Object.entries(priceBreakdown.additionalCharges).map(([type, charge], index) => (
                    <div key={`charge-${index}`} className="additional-charge-row">
                      <div className="charge-label">
                        {charge.isPercentage ? (
                          <Percent size={12} />
                        ) : (
                          <Plus size={12} />
                        )}
                        <span>{type}</span>
                        {charge.isPercentage && (
                          <span className="percentage-badge">{charge.originalAmount}%</span>
                        )}
                      </div>
                      <span>{formatCurrency(charge.amount)}</span>
                    </div>
                  ))}
                  
                  <div className="additional-charge-row subtotal">
                    <span>Total Additional Charges</span>
                    <span>{formatCurrency(priceBreakdown.totalAdditionalAmount)}</span>
                  </div>
                </div>
              )}
              
              {priceBreakdown.discount > 0 && (
                <div className="amount-row discount">
                  <span>Discount</span>
                  <span>- {formatCurrency(priceBreakdown.discount)}</span>
                </div>
              )}
              
              <div className="amount-row total">
                <span>Total Amount</span>
                <span>{formatCurrency(priceBreakdown.total)}</span>
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
                    <span>Pay {formatCurrency(priceBreakdown.total)}</span>
                  </>
                )}
              </button>
              
              <div className="payment-methods">
                <p>Supported Payment Methods:</p>
                <div className="method-icons">
                  <span className="method-icon">
                    <CardIcon size={12} className="me-1" />
                    <span>Credit Card</span>
                  </span>
                  <span className="method-icon">
                    <CardIcon size={12} className="me-1" />
                    <span>Debit Card</span>
                  </span>
                  <span className="method-icon">
                    <Building size={12} className="me-1" />
                    <span>Net Banking</span>
                  </span>
                  <span className="method-icon">
                    <Smartphone size={12} className="me-1" />
                    <span>UPI</span>
                  </span>
                </div>
              </div>
              
              <div className="security-note">
                <p>
                  <Lock size={14} />
                  <span>Your transaction is secure and encrypted</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;