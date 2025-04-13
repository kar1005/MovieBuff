import React, { useState, useEffect, useRef } from 'react';
import { useParams,useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Loader, 
  AlertCircle, 
  Check, 
  X, 
  ArrowLeft, 
  Monitor, 
  Square, 
  Tag,
  ChevronDown,
  Info
} from 'lucide-react';
import showService from '../../../../services/showService';
import './SeatBooking.css';

const SeatBooking = ({ onBookingComplete, onBack }) => {
  const showId = useParams();
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [bookingStatus, setBookingStatus] = useState('selecting'); // selecting, reserving, reserved, payment, success, timeout, error
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [expandedInfo, setExpandedInfo] = useState(false);
  const timerRef = useRef(null);
  const gridRef = useRef(null);

  // Fetch show details including seat availability
  useEffect(() => {
    const fetchShowDetails = async () => {
      try {
        setLoading(true);
        const showData = await showService.getShow(showId);
        const seatAvailability = await showService.getSeatAvailability(showId);
        
        setShow({
          ...showData,
          seatAvailability: seatAvailability
        });
        setLoading(false);
      } catch (err) {
        setError("Failed to load show details. Please try again.");
        setLoading(false);
      }
    };

    fetchShowDetails();
  }, [showId]);

  // Handle timer countdown
  useEffect(() => {
    if (bookingStatus === 'reserved' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current);
            handleTimeout();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [bookingStatus]);

  const handleTimeout = async () => {
    try {
      // Release the seats
      await showService.updateSeatAvailability(showId, selectedSeats, true);
      setBookingStatus('timeout');
      setSelectedSeats([]);
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  const handleSeatClick = (seat) => {
    if (bookingStatus !== 'selecting') return;
    if (seat.status === 'BOOKED' || seat.status === 'UNAVAILABLE' || seat.status === 'BLOCKED') return;
    
    const seatId = seat.seatId;
    
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(id => id !== seatId));
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const getSeatStatus = (seat) => {
    if (seat.status === 'BOOKED' || seat.status === 'UNAVAILABLE') {
      return 'booked';
    }
    if (seat.status === 'BLOCKED') {
      return 'blocked';
    }
    if (selectedSeats.includes(seat.seatId)) {
      return 'selected';
    }
    return 'available';
  };

  const calculateTotalPrice = () => {
    if (!show || !show.pricing || selectedSeats.length === 0) return 0;
    
    let total = 0;
    selectedSeats.forEach(seatId => {
      // Find seat category from the seat data
      const seat = show.seatAvailability.seats.find(s => s.seatId === seatId);
      if (seat) {
        const pricing = show.pricing[seat.category];
        if (pricing) {
          total += pricing.finalPrice;
        }
      }
    });
    
    return total;
  };

  const handleReserveSeats = async () => {
    if (selectedSeats.length === 0) return;
    
    try {
      setBookingStatus('reserving');
      // Mark seats as blocked (temporarily unavailable during checkout)
      await showService.updateSeatAvailability(showId, selectedSeats, false);
      setBookingStatus('reserved');
      setTimeLeft(300); // Reset timer to 5 minutes
    } catch (err) {
      setError("Sorry, one or more seats are no longer available. Please try again.");
      setBookingStatus('selecting');
      // Refresh seat data
      const seatAvailability = await showService.getSeatAvailability(showId);
      setShow(prev => ({ ...prev, seatAvailability }));
      setSelectedSeats([]);
    }
  };

  const handlePayment = async () => {
    try {
      setPaymentProcessing(true);
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update seat status to BOOKED after successful payment
      await showService.updateSeatAvailability(showId, selectedSeats, false);
      
      clearInterval(timerRef.current);
      setBookingStatus('success');
      setPaymentProcessing(false);
      
      // Call the completion callback
      if (onBookingComplete) {
        onBookingComplete({
          showId,
          seats: selectedSeats,
          totalAmount: calculateTotalPrice()
        });
      }
    } catch (err) {
      setError("Payment failed. Please try again.");
      setPaymentProcessing(false);
    }
  };

  const handleCancelBooking = async () => {
    if (bookingStatus === 'reserved') {
      try {
        // Release the seats
        await showService.updateSeatAvailability(showId, selectedSeats, true);
        clearInterval(timerRef.current);
        setBookingStatus('selecting');
        setSelectedSeats([]);
      } catch (err) {
        setError("An error occurred. Please try again.");
      }
    } else {
      setSelectedSeats([]);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getContrastColor = (hexColor) => {
    // Default to white if no color provided
    if (!hexColor) return 'white';
    
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Calculate brightness
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Return white for dark backgrounds, black for light backgrounds
    return brightness > 128 ? 'black' : 'white';
  };

  // Function to get seat icon/label based on type
  const getSeatIcon = (seatType) => {
    switch(seatType) {
      case 'RECLINER':
        return '🛋️';
      case 'WHEELCHAIR':
        return '♿';
      case 'COMPANION':
        return '👥';
      case 'VIP':
        return '⭐';
      default:
        return null;
    }
  };

  // Function to create grid data from sections and seats
  const createGridLayout = () => {
    if (!show || !show.seatAvailability) return { rows: 0, columns: 0, grid: [] };
    
    const totalRows = show.seatAvailability.layout?.totalRows || 10;
    const totalColumns = show.seatAvailability.layout?.totalColumns || 15;
    
    // Initialize empty grid
    const grid = Array(totalRows).fill(null).map(() =>
      Array(totalColumns).fill(null).map(() => ({
        type: 'EMPTY',
        category: null,
        seatType: null,
        seatId: null,
        status: null
      }))
    );
    
    // Map seats to grid
    show.seatAvailability.seats.forEach((seat) => {
      if (seat.row > 0 && seat.row <= totalRows && seat.column > 0 && seat.column <= totalColumns) {
        const row = seat.row - 1;
        const col = seat.column - 1;
        
        grid[row][col] = {
          type: 'SEAT',
          category: seat.category,
          seatType: seat.type || 'REGULAR',
          seatId: seat.seatId,
          status: seat.status,
          pricing: show.pricing?.[seat.category]?.finalPrice || 0
        };
      }
    });
    
    // Map aisles, stairs, exits, gaps if available from layout
    if (show.seatAvailability.layout) {
      // Aisles
      show.seatAvailability.layout.aisles?.forEach((aisle) => {
        for (let row = aisle.startPosition - 1; row < aisle.endPosition; row++) {
          const col = aisle.position - 1;
          if (row >= 0 && row < totalRows && col >= 0 && col < totalColumns) {
            grid[row][col] = { type: 'AISLE', category: null };
          }
        }
      });
      
      // Stairs
      show.seatAvailability.layout.stairs?.forEach((stair) => {
        const row = stair.row - 1;
        const col = stair.column - 1;
        
        if (row >= 0 && row < totalRows && col >= 0 && col < totalColumns) {
          grid[row][col] = { type: 'STAIRS', category: null };
        }
      });
      
      // Exits
      show.seatAvailability.layout.exits?.forEach((exit) => {
        const row = exit.row - 1;
        const col = exit.column - 1;
        
        if (row >= 0 && row < totalRows && col >= 0 && col < totalColumns) {
          grid[row][col] = { type: 'EXIT', category: null };
        }
      });
      
      // Gaps
      show.seatAvailability.layout.seatGaps?.forEach((gap) => {
        const row = gap.row - 1;
        const col = gap.column - 1;
        
        if (row >= 0 && row < totalRows && col >= 0 && col < totalColumns) {
          grid[row][col] = { type: 'GAP', category: null };
        }
      });
    }
    
    return { rows: totalRows, columns: totalColumns, grid };
  };

  // Create the grid layout
  const gridLayout = show ? createGridLayout() : { rows: 0, columns: 0, grid: [] };

  // Get category colors
  const getCategoryColors = () => {
    if (!show || !show.seatAvailability) return {};
    
    const categoryColors = {};
    show.seatAvailability.sections?.forEach(section => {
      categoryColors[section.categoryName] = section.color || '#9333ea';
    });
    
    return categoryColors;
  };
  
  const categoryColors = getCategoryColors();

  // Render loading state
  if (loading) {
    return (
      <div className="theater-booking-loading">
        <Loader className="animate-spin" size={32} />
        <p>Loading seat map...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="theater-booking-error">
        <AlertCircle size={32} />
        <p>{error}</p>
        <button className="btn btn-retry" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  // Render when show data isn't available
  if (!show) {
    return (
      <div className="theater-booking-error">
        <p>Show information not available.</p>
      </div>
    );
  }

  return (
    <div className="theater-booking-container">
      {/* Header */}
      <div className="theater-booking-header">
        <div className="header-main">
          <button className="back-button" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          <h2>{show.movieTitle}</h2>
        </div>
        
        <div className="header-details">
          <span>{show.theaterName}</span>
          <span className="separator">•</span>
          <span>Screen {show.screenNumber}</span>
          <span className="separator">•</span>
          <span>{new Date(show.showTime).toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })}</span>
          <span className="separator">•</span>
          <span>{show.language}</span>
          <span className="separator">•</span>
          <span>{show.experience}</span>
        </div>
      </div>

      {/* Status Messages */}
      {bookingStatus === 'reserved' && (
        <div className="status-alert warning">
          <Clock size={18} />
          <span>Complete payment within {formatTime(timeLeft)} or seats will be released</span>
        </div>
      )}
      
      {bookingStatus === 'success' && (
        <div className="status-alert success">
          <Check size={18} />
          <span>Booking successful! Your tickets have been confirmed.</span>
        </div>
      )}
      
      {bookingStatus === 'timeout' && (
        <div className="status-alert error">
          <X size={18} />
          <span>Booking timed out. Your selected seats have been released.</span>
        </div>
      )}

      <div className="theater-layout-container">
        {/* Screen */}
        <div className="theater-screen">
          <div className="screen-curve"></div>
          <div className="screen-label">SCREEN</div>
        </div>
        
        {/* Legend */}
        <div className="seat-legend">
          <div className="legend-item">
            <div className="legend-box available"></div>
            <span>Available</span>
          </div>
          <div className="legend-item">
            <div className="legend-box selected"></div>
            <span>Selected</span>
          </div>
          <div className="legend-item">
            <div className="legend-box booked"></div>
            <span>Booked</span>
          </div>
          <div className="legend-item">
            <div className="legend-box blocked"></div>
            <span>Reserved</span>
          </div>
        </div>
        
        {/* Category Info */}
        <div className="category-list">
          {show.seatAvailability.sections?.map((section) => (
            <div 
              key={section.categoryName} 
              className="category-badge"
              style={{ 
                backgroundColor: section.color || '#9333ea',
                color: getContrastColor(section.color)
              }}
            >
              {section.categoryName}: ₹{section.basePrice}
            </div>
          ))}
        </div>
        
        {/* Seat Types Legend (toggleable) */}
        <div className="seat-types-container">
          <button 
            className={`toggle-info-btn ${expandedInfo ? 'active' : ''}`}
            onClick={() => setExpandedInfo(!expandedInfo)}
          >
            <Info size={14} />
            <span>Seat Types</span>
            <ChevronDown size={14} className={expandedInfo ? 'rotated' : ''} />
          </button>
          
          {expandedInfo && (
            <div className="seat-types-legend">
              <div className="legend-item">
                <div className="legend-box seat-regular">A1</div>
                <span>Regular</span>
              </div>
              <div className="legend-item">
                <div className="legend-box seat-recliner">🛋️</div>
                <span>Recliner</span>
              </div>
              <div className="legend-item">
                <div className="legend-box seat-wheelchair">♿</div>
                <span>Wheelchair</span>
              </div>
              <div className="legend-item">
                <div className="legend-box seat-companion">👥</div>
                <span>Companion</span>
              </div>
              <div className="legend-item">
                <div className="legend-box seat-vip">⭐</div>
                <span>VIP</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Grid Layout */}
        <div className="theater-grid-wrapper" ref={gridRef}>
          <div className="theater-grid">
            {/* Column Numbers */}
            <div className="grid-columns-header">
              <div className="grid-row-label"></div>
              {Array.from({ length: gridLayout.columns }).map((_, index) => (
                <div key={`col-${index}`} className="grid-column-label">
                  {index + 1}
                </div>
              ))}
            </div>
            
            {/* Grid with Row Labels */}
            {gridLayout.grid.map((row, rowIndex) => (
              <div key={`row-${rowIndex}`} className="grid-row">
                <div className="grid-row-label">
                  {String.fromCharCode(65 + rowIndex)}
                </div>
                {row.map((cell, colIndex) => {
                  if (cell.type === 'EMPTY') {
                    return (
                      <div key={`${rowIndex}-${colIndex}`} className="grid-cell empty"></div>
                    );
                  }
                  
                  if (cell.type === 'AISLE') {
                    return (
                      <div key={`${rowIndex}-${colIndex}`} className="grid-cell aisle">≡</div>
                    );
                  }
                  
                  if (cell.type === 'STAIRS') {
                    return (
                      <div key={`${rowIndex}-${colIndex}`} className="grid-cell stairs">↑</div>
                    );
                  }
                  
                  if (cell.type === 'EXIT') {
                    return (
                      <div key={`${rowIndex}-${colIndex}`} className="grid-cell exit">EXIT</div>
                    );
                  }
                  
                  if (cell.type === 'GAP') {
                    return (
                      <div key={`${rowIndex}-${colIndex}`} className="grid-cell gap">◦</div>
                    );
                  }
                  
                  if (cell.type === 'SEAT') {
                    const status = getSeatStatus(cell);
                    const seatColor = categoryColors[cell.category];
                    const seatIcon = getSeatIcon(cell.seatType);
                    
                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`grid-cell seat ${status}`}
                        style={status === 'available' ? {
                          backgroundColor: seatColor,
                          color: getContrastColor(seatColor)
                        } : {}}
                        onClick={() => handleSeatClick(cell)}
                        title={`${cell.seatId} - ${cell.category} - ₹${cell.pricing}`}
                      >
                        <div className="seat-content">
                          <span className="seat-id">{cell.seatId}</span>
                          {seatIcon && <span className="seat-type-icon">{seatIcon}</span>}
                        </div>
                      </div>
                    );
                  }
                  
                  return null;
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Summary */}
      <div className="booking-summary">
        <h3>Booking Summary</h3>
        <div className="summary-row">
          <span>Selected Seats:</span>
          <span className="summary-value">{selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'}</span>
        </div>
        <div className="summary-row total">
          <span>Total Amount:</span>
          <span className="summary-value">₹{calculateTotalPrice()}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="booking-actions">
        <button
          className="btn btn-cancel"
          onClick={handleCancelBooking}
          disabled={bookingStatus === 'success' || bookingStatus === 'payment' || bookingStatus === 'reserving'}
        >
          Cancel
        </button>
        
        {bookingStatus === 'selecting' ? (
          <button
            className="btn btn-reserve"
            onClick={handleReserveSeats}
            disabled={selectedSeats.length === 0}
          >
            Reserve Seats
          </button>
        ) : bookingStatus === 'reserved' ? (
          <button
            className="btn btn-payment"
            onClick={handlePayment}
            disabled={paymentProcessing}
          >
            {paymentProcessing ? 'Processing...' : 'Proceed to Payment'}
          </button>
        ) : bookingStatus === 'success' ? (
          <button
            className="btn btn-view"
            onClick={() => window.location.href = '/bookings'}
          >
            View Bookings
          </button>
        ) : bookingStatus === 'timeout' ? (
          <button
            className="btn btn-retry"
            onClick={() => {
              setBookingStatus('selecting');
              setError(null);
            }}
          >
            Try Again
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default SeatBooking;