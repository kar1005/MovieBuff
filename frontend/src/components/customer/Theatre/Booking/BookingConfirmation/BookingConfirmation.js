import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  CheckCircle, 
  Download, 
  Share2, 
  Ticket, 
  Calendar, 
  Clock, 
  MapPin, 
  AlertCircle, 
  CreditCard
} from 'lucide-react';
import bookingService from '../../../../../services/bookingService';
import './BookingConfirmation.css';

const BookingConfirmation = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  
  // Fetch booking details and QR code
  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        
        // Get booking details
        const bookingResponse = await bookingService.getBookingById(bookingId);
        setBooking(bookingResponse);
        
        // Generate ticket if needed and get QR code
        if (bookingResponse.status === 'CONFIRMED' && 
            (!bookingResponse.ticketStatus || bookingResponse.ticketStatus === 'PENDING')) {
          // Generate ticket
          await bookingService.generateTicket(bookingId);
        }
        
        // Get QR code
        const qrResponse = await bookingService.getTicketQRCode(bookingId);
        setQrCode(qrResponse.qrCodeUrl);
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching booking details:", err);
        setError("Failed to load booking information. Please try again.");
        setLoading(false);
        toast.error("Failed to load booking confirmation");
      }
    };
    
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);
  
  // Handle email notification
  const handleSendEmail = async () => {
    try {
      await bookingService.sendTicketNotification(bookingId, { email: true, sms: false });
      toast.success("Ticket has been sent to your email");
    } catch (err) {
      console.error("Error sending email:", err);
      toast.error("Failed to send email. Please try again.");
    }
  };
  
  // Handle SMS notification
  const handleSendSMS = async () => {
    try {
      await bookingService.sendTicketNotification(bookingId, { email: false, sms: true });
      toast.success("Ticket has been sent to your phone");
    } catch (err) {
      console.error("Error sending SMS:", err);
      toast.error("Failed to send SMS. Please try again.");
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Format time
  const formatTime = (dateString) => {
    const options = { hour: '2-digit', minute: '2-digit', hour12: true };
    return new Date(dateString).toLocaleTimeString('en-US', options);
  };
  
  // Show loading state
  if (loading) {
    return (
      <div className="container my-3 text-center">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading booking confirmation...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container my-3 text-center">
        <div className="alert alert-danger">
          <AlertCircle size={20} />
          <p>{error}</p>
          <button className="btn btn-outline-danger btn-sm" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // If booking not found
  if (!booking) {
    return (
      <div className="container my-3 text-center">
        <div className="alert alert-warning">
          <AlertCircle size={20} />
          <p>Booking not found. Please check your booking details.</p>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-confirmation-wrapper">
      <div className="booking-confirmation-container container py-2">
        <div className="success-header text-center mb-2">
          <CheckCircle size={32} className="success-icon" />
          <h2>Booking Confirmed!</h2>
          <p className="confirmation-text">
            Your tickets for <strong>{booking.movieTitle}</strong> have been confirmed.
            Booking ID: <span className="booking-id">{booking.bookingNumber}</span>
          </p>
        </div>
        
        <div className="row">
          <div className="col-md-7 mb-2">
            <div className="confirmation-card">
              <div className="ticket-header">
                <Ticket size={16} />
                <h3>Ticket Details</h3>
              </div>
              
              <div className="movie-details">
                <h4>{booking.movieTitle}</h4>
                <div className="experience-badge">{booking.experience} | {booking.language}</div>
              </div>
              
              <div className="details-grid">
                <div className="detail-item">
                  <Calendar size={14} />
                  <div>
                    <p className="detail-label">Date</p>
                    <p className="detail-value">{formatDate(booking.showTime)}</p>
                  </div>
                </div>
                
                <div className="detail-item">
                  <Clock size={14} />
                  <div>
                    <p className="detail-label">Show Time</p>
                    <p className="detail-value">{formatTime(booking.showTime)}</p>
                  </div>
                </div>
                
                <div className="detail-item">
                  <MapPin size={14} />
                  <div>
                    <p className="detail-label">Theater</p>
                    <p className="detail-value">{booking.theaterName}</p>
                    <p className="detail-subvalue">Screen {booking.screenNumber}</p>
                  </div>
                </div>
              </div>
              
              <div className="seat-details">
                <h5>Seat Information</h5>
                <div className="seats-grid">
                  {booking.seats && booking.seats.map(seat => (
                    <div key={seat.seatId} className="seat-item">
                      <div className="seat-number">{seat.seatId}</div>
                      <div className="seat-category">{seat.category}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="payment-details">
                <h5>Payment Information</h5>
                <div className="detail-row">
                  <span>Payment Method:</span>
                  <span>{booking.paymentDetails?.method || 'Credit Card'}</span>
                </div>
                <div className="detail-row">
                  <span>Amount Paid:</span>
                  <span>₹{booking.totalAmount?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="detail-row">
                  <span>Transaction ID:</span>
                  <span>{booking.paymentDetails?.transactionId || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-md-5">
            <div className="qr-card">
              <h3>Scan at the theater</h3>
              <div className="qr-container">
                {qrCode ? (
                  <img src={qrCode} alt="Ticket QR Code" className="qr-code" />
                ) : (
                  <div className="qr-placeholder">QR Code Loading...</div>
                )}
              </div>
              <p className="qr-info">
                Show this QR code at the theater entrance for verification
              </p>
              
              {/* <div className="action-buttons">
                <button className="btn-action" onClick={handleSendEmail}>
                  <Download size={14} />
                  Email Ticket
                </button>
                <button className="btn-action" onClick={handleSendSMS}>
                  <Share2 size={14} />
                  SMS Ticket
                </button>
              </div> */}
            </div>
            
            <div className="info-card mt-2">
              <h5>Important Information</h5>
              <ul>
                <li>Please arrive at least 15 minutes before showtime</li>
                <li>Outside food and beverages are not allowed</li>
                <li>Booking is non-transferable and non-refundable</li>
                <li>In case of any issues, please contact theater management</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="text-center my-2">
          <button className="btn btn-primary" onClick={() => navigate('/movies')}>
            Book Another Movie
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;