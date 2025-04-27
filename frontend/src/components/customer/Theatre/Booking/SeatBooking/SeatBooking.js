import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  Clock, 
  CreditCard, 
  AlertTriangle, 
  Monitor, 
  Users, 
  ArrowLeft, 
  Tag, 
  Ticket, 
  Armchair,
  Users2,
  Crown,
  Plus,
  Percent,
  DollarSign
} from 'lucide-react';
import showService from '../../../../../services/showService';
import bookingService from '../../../../../services/bookingService';
import theaterService from '../../../../../services/theaterService';
import movieService from '../../../../../services/movieService';
import './SeatBooking.css';

const SeatBooking = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  
  // State variables
  const [show, setShow] = useState(null);
  const [theater, setTheater] = useState(null);
  const [screen, setScreen] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [reservedSeats, setReservedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timer, setTimer] = useState(300); // 5 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [subtotalAmount, setSubtotalAmount] = useState(0);
  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [seatCategories, setSeatCategories] = useState([]);
  const [categoryColors, setCategoryColors] = useState({});
  const [movieTitle, setMovieTitle] = useState('');
  const [selectedSeatsDetails, setSelectedSeatsDetails] = useState([]);
  const [additionalChargesBreakdown, setAdditionalChargesBreakdown] = useState({});

  // Fetch initial data
  useEffect(() => {
    const fetchShowData = async () => {
      try {
        setLoading(true);
        
        // Get show details
        const showData = await showService.getShow(showId);
        setShow(showData);
        
        // Get movie details if available
        if (showData.movieId) {
          try {
            const movieData = await movieService.getMovieById(showData.movieId);
            if (movieData) {
              setMovieTitle(movieData.title);
            }
          } catch (err) {
            console.error("Error fetching movie details:", err);
            setMovieTitle(showData.movieTitle || 'Movie');
          }
        }
        
        // Get theater details
        const theaterData = await theaterService.getTheaterById(showData.theaterId);
        setTheater(theaterData);
        
        // Find the screen from theater data
        const screenData = theaterData.screens.find(s => s.screenNumber === showData.screenNumber);
        if (screenData) {
          setScreen(screenData);
          
          // Extract colors from screen sections
          const colors = {};
          if (screenData.layout && screenData.layout.sections) {
            screenData.layout.sections.forEach(section => {
              colors[section.categoryName] = section.color || '#64748b';
            });
            setCategoryColors(colors);
          }
        }
        
        // Get booked and reserved seats
        await refreshSeatStatus();
        
        // Extract unique seat categories from pricing data
        if (showData.pricing) {
          const categories = Object.keys(showData.pricing);
          setSeatCategories(categories);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load show data. Please try again.");
        setLoading(false);
        toast.error("Failed to load seat booking information");
      }
    };
    
    fetchShowData();
    
    // Set up periodic refresh for seat status
    const intervalId = setInterval(() => {
      if (!loading) {
        refreshSeatStatus();
      }
    }, 10000); // Refresh every 10 seconds
    
    return () => {
      clearInterval(intervalId);
      // Release any selected seats when component unmounts
      if (selectedSeats.length > 0) {
        handleReleaseAllSeats();
      }
    };
  }, [showId]);
  
  // Timer effect
  useEffect(() => {
    let interval;
    if (timerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer(prevTimer => prevTimer - 1);
      }, 1000);
    } else if (timer === 0 && selectedSeats.length > 0) {
      // Time expired, release all seats
      handleReleaseAllSeats();
      toast.warning("Time expired! Your seats have been released.");
    }
    
    return () => clearInterval(interval);
  }, [timerActive, timer, selectedSeats]);

  // Calculate total amount when selected seats change
  useEffect(() => {
    if (show && selectedSeats.length > 0) {
      calculatePricing();
      
      // Start timer if not already active
      if (!timerActive) {
        setTimerActive(true);
      }
    } else if (selectedSeats.length === 0) {
      setTotalAmount(0);
      setSubtotalAmount(0);
      setAdditionalCharges(0);
      setAdditionalChargesBreakdown({});
      setSelectedSeatsDetails([]);
      setTimerActive(false);
      setTimer(300); // Reset timer
    }
  }, [selectedSeats, show]);

  // Helper function to refresh seat status
  const refreshSeatStatus = async () => {
    try {
      const bookedResponse = await bookingService.getBookedSeats(showId);
      setBookedSeats(bookedResponse.map(seat => seat.seatId));
      
      const reservedResponse = await bookingService.getReservedSeats(showId);
      
      // Filter out seats that are in our selection
      const otherReservedSeats = reservedResponse
        .filter(seat => !selectedSeats.includes(seat.seatId))
        .map(seat => seat.seatId);
      
      setReservedSeats(otherReservedSeats);
    } catch (err) {
      console.error("Error refreshing seat status:", err);
    }
  };

  // Calculate pricing details for selected seats
  const calculatePricing = () => {
    if (!show || !show.pricing) return;

    let subtotal = 0;
    let additionalTotal = 0;
    const chargesBreakdown = {};
    const seatsDetails = [];

    selectedSeats.forEach(seatId => {
      const foundSeat = findSeatById(seatId);
      if (foundSeat && foundSeat.category) {
        const pricing = show.pricing[foundSeat.category];
        
        if (pricing) {
          const basePrice = pricing.basePrice || 0;
          subtotal += basePrice;
          
          // Create seat detail record
          const seatDetail = {
            seatId,
            row: foundSeat.row,
            column: foundSeat.column,
            category: foundSeat.category,
            basePrice: basePrice,
            finalPrice: pricing.finalPrice || basePrice
          };
          
          seatsDetails.push(seatDetail);
          
          // Calculate additional charges
          if (pricing.additionalCharges) {
            pricing.additionalCharges.forEach(charge => {
              let chargeAmount = 0;
              
              if (charge.isPercentage) {
                // Calculate percentage of base price
                chargeAmount = basePrice * (charge.amount / 100);
              } else {
                // Fixed charge
                chargeAmount = charge.amount;
              }
              
              additionalTotal += chargeAmount;
              
              // Add to breakdown
              if (!chargesBreakdown[charge.type]) {
                chargesBreakdown[charge.type] = {
                  amount: 0,
                  isPercentage: charge.isPercentage,
                  originalAmount: charge.amount
                };
              }
              chargesBreakdown[charge.type].amount += chargeAmount;
            });
          }
        }
      }
    });

    // Update state with calculated values
    setSubtotalAmount(subtotal);
    setAdditionalCharges(additionalTotal);
    setTotalAmount(subtotal + additionalTotal);
    setAdditionalChargesBreakdown(chargesBreakdown);
    setSelectedSeatsDetails(seatsDetails);
  };

  // Find seat information by ID
  const findSeatById = (seatId) => {
    if (!screen || !screen.layout || !screen.layout.sections) return null;
    
    // Iterate through sections and seats to find the matching seat
    for (const section of screen.layout.sections) {
      if (section.seats) {
        const foundSeat = section.seats.find(seat => seat.seatNumber === seatId);
        if (foundSeat) {
          return {
            ...foundSeat,
            category: section.categoryName
          };
        }
      }
    }
    return null;
  };

  // Handler for seat click
  const handleSeatClick = async (seatId) => {
    // Check if seat is already booked or reserved by someone else
    if (bookedSeats.includes(seatId) || reservedSeats.includes(seatId)) {
      toast.info("This seat is not available");
      return;
    }
    
    // Toggle seat selection
    if (selectedSeats.includes(seatId)) {
      // Deselect the seat
      try {
        await bookingService.releaseSeat(showId, seatId);
        setSelectedSeats(prev => prev.filter(id => id !== seatId));
      } catch (err) {
        console.error("Error releasing seat:", err);
        toast.error("Failed to release seat. Please try again.");
      }
    } else {
      // Select the seat
      try {
        const response = await bookingService.reserveSeat(showId, seatId);
        
        if (response.success) {
          setSelectedSeats(prev => [...prev, seatId]);
          
          // Create temporary booking if this is our first seat
          if (selectedSeats.length === 0 && !bookingId) {
            try {
              const bookingResponse = await bookingService.createTemporaryBooking(showId);
              setBookingId(bookingResponse.id);
            } catch (err) {
              console.error("Error creating temporary booking:", err);
            }
          }
        } else {
          toast.warning("This seat just became unavailable");
          await refreshSeatStatus();
        }
      } catch (err) {
        console.error("Error reserving seat:", err);
        toast.error("Failed to reserve seat. Please try again.");
        await refreshSeatStatus();
      }
    }
  };

  // Handler to release all selected seats
  const handleReleaseAllSeats = async () => {
    if (selectedSeats.length === 0) return;
    
    try {
      await bookingService.releaseSeats(showId, selectedSeats);
      setSelectedSeats([]);
      setTimerActive(false);
      setTimer(300); // Reset timer
      await refreshSeatStatus();
    } catch (err) {
      console.error("Error releasing seats:", err);
      toast.error("Failed to release seats");
    }
  };

  // Handler for proceeding to payment
  const handleProceedToPayment = async () => {
    if (selectedSeats.length === 0) {
      toast.warning("Please select at least one seat");
      return;
    }
    
    try {
      // Get user ID from localStorage or auth context
      const userId = localStorage.getItem('userId'); // Or use your auth context
      
      if (!userId) {
        toast.error("You must be logged in to book tickets");
        navigate('/auth/login', { state: { from: `/shows/${showId}` } });
        return;
      }
      
      // Prepare booking data including all required fields from Booking.java
      const bookingData = {
        showId,
        userId,
        seats: selectedSeatsDetails,
        totalSeats: selectedSeats.length,
        subtotalAmount: subtotalAmount,
        additionalCharges: additionalCharges,
        totalAmount: totalAmount,
        // Include any additional fields that your backend requires
        movieId: show.movieId,
        movieTitle: movieTitle,
        theaterId: theater.id,
        theaterName: theater.name,
        screenNumber: screen.screenNumber,
        showTime: show.showTime,
        experience: show.experience,
        language: show.language
      };
      
      // First, confirm the reservation
      const response = await bookingService.confirmReservation(showId, selectedSeats, bookingId);
      
      // Navigate to payment page with booking ID
      navigate(`/customer/payment/${response.id}`, { 
        state: { 
          bookingDetails: bookingData,
          additionalChargesBreakdown
        } 
      });
    } catch (err) {
      console.error("Error confirming reservation:", err);
      toast.error("Failed to process reservation. Please try again.");
      await refreshSeatStatus();
    }
  };

  // Format the timer
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Get status class for a seat
  const getSeatStatusClass = (seatId) => {
    if (bookedSeats.includes(seatId)) return 'booked';
    if (reservedSeats.includes(seatId)) return 'reserved';
    if (selectedSeats.includes(seatId)) return 'selected';
    return 'available';
  };

  // Format movie showtime
  const formatShowtime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render the seating layout
  const renderSeatingLayout = () => {
    if (!screen || !screen.layout) return null;
    
    const { totalRows, totalColumns, sections, aisles, seatGaps, unavailableSeats } = screen.layout;
    
    // Create a matrix representation of the seating layout
    const seatMatrix = Array(totalRows).fill().map(() => Array(totalColumns).fill(null));
    
    // Mark unavailable positions
    const unavailablePositions = new Set();
    
    // Add unavailable seats to set
    if (unavailableSeats) {
      unavailableSeats.forEach(seat => {
        unavailablePositions.add(`${seat.row}-${seat.column}`);
      });
    }
    
    // Add seat gaps to set
    if (seatGaps) {
      seatGaps.forEach(gap => {
        unavailablePositions.add(`${gap.row}-${gap.column}`);
      });
    }
    
    // Mark aisle positions
    const aislePositions = new Set();
    if (aisles) {
      aisles.forEach(aisle => {
        if (aisle.type === "HORIZONTAL") {
          for (let col = aisle.startPosition; col <= aisle.endPosition; col++) {
            aislePositions.add(`${aisle.position}-${col}`);
          }
        } else if (aisle.type === "VERTICAL") {
          for (let row = aisle.startPosition; row <= aisle.endPosition; row++) {
            aislePositions.add(`${row}-${aisle.position}`);
          }
        }
      });
    }
    
    // Fill in the seats from sections
    if (sections) {
      sections.forEach(section => {
        if (section.seats) {
          section.seats.forEach(seat => {
            if (seat.isActive && !unavailablePositions.has(`${seat.row}-${seat.column}`)) {
              seatMatrix[seat.row - 1][seat.column - 1] = {
                ...seat,
                category: section.categoryName,
                seatColor: section.color || '#64748b',
                basePrice: section.basePrice
              };
            }
          });
        }
      });
    }
    
    // Render the seating layout
    return (
      <div className="seating-layout">
        {seatMatrix.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="seat-row">
            <div className="row-label">{String.fromCharCode(65 + rowIndex)}</div>
            {row.map((seat, colIndex) => {
              const position = `${rowIndex + 1}-${colIndex + 1}`;
              
              // Check if this position is an aisle
              if (aislePositions.has(position)) {
                return <div key={`aisle-${position}`} className="seat-aisle"></div>;
              }
              
              // Check if this position is unavailable
              if (unavailablePositions.has(position)) {
                return <div key={`unavailable-${position}`} className="seat-gap"></div>;
              }
              
              // Render seat or empty space
              if (seat) {
                const seatId = seat.seatNumber;
                const statusClass = getSeatStatusClass(seatId);
                const categoryClass = seat.category.toLowerCase().replace(/\s+/g, '-');
                
                const seatType = seat.type?.toLowerCase() || 'regular';
                
                return (
                  <button
  key={`seat-${seatId}`}
  className={`seat ${statusClass} ${categoryClass} ${seatType}`}
  onClick={() => handleSeatClick(seatId)}
  disabled={statusClass === 'booked' || statusClass === 'reserved'}
  aria-label={`Seat ${seatId}`}
  title={`${seatId} - ${seat.category} - ${seat.type || 'Regular'} - ₹${show.pricing[seat.category]?.finalPrice || seat.basePrice}`}
  style={{
    borderColor: seat.seatColor,
    '--seat-category-color': seat.seatColor,
    // Remove any direct background-color setting here
  }}
>
                    {seatId.substring(1)}
                    {seatType === 'recliner' && (
                      <span className="seat-type-indicator">
                        <Armchair size={10} />
                      </span>
                    )}
                    {seatType === 'companion' && (
                      <span className="seat-type-indicator">
                        <Users2 size={10} />
                      </span>
                    )}
                    {seatType === 'vip' && (
                      <span className="seat-type-indicator">
                        <Crown size={10} />
                      </span>
                    )}
                  </button>
                );
              }
              
              return <div key={`empty-${position}`} className="seat-gap"></div>;
            })}
          </div>
        ))}
      </div>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <div className="container-fluid seat-booking-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading seat layout...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container-fluid seat-booking-container">
        <div className="error-container">
          <AlertTriangle size={32} />
          <h4>Error</h4>
          <p>{error}</p>
          <button className="btn btn-outline-danger" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Return the seat booking UI
  return (
    <div className="container-fluid seat-booking-container">
      <div className="booking-header">
  <button 
    className="back-button"
    onClick={() => navigate(-1)}
  >
    <ArrowLeft size={18} />
    <span>Back</span>
  </button>

  <div className="book-movie-info-head">
    <h1>{movieTitle || 'Movie Title'}</h1>
    <div className="theater-info">
      <span>{theater?.name}</span>
      <span className="separator">•</span>
      <span>Screen {screen?.screenNumber}</span>
      <span className="separator">•</span>
      <span>{show && formatShowtime(show.showTime)}</span>
    </div>
    <div className="book-movie-tags">
      <span className="tag">{show?.language}</span>
      <span className="tag">{show?.experience}</span>
    </div>
  </div>
</div>
      
      {timerActive && (
        <div className="timer-banner">
          <Clock size={16} />
          <span>Seat selection expires in </span>
          <strong>{formatTime(timer)}</strong>
        </div>
      )}
      
      <div className="screen-area">
        <div className="screen">
          <Monitor size={16} />
          <span>SCREEN</span>
        </div>
      </div>
      
      <div className="seat-legend">
        {seatCategories.map(category => (
          <div key={`legend-${category}`} className="legend-item">
            <div 
              className="seat-legend-box"
              style={{ borderColor: categoryColors[category] || '#64748b' }}
            ></div>
            <span>{category} - ₹{show?.pricing[category]?.finalPrice}</span>
          </div>
        ))}
        
        <div className="legend-divider"></div>
        
        <div className="legend-item">
          <div className="seat-legend-box available"></div>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="seat-legend-box selected"></div>
          <span>Selected</span>
        </div>
        <div className="legend-item">
          <div className="seat-legend-box booked"></div>
          <span>Sold</span>
        </div>
        <div className="legend-item">
          <div className="seat-legend-box reserved"></div>
          <span>Reserved</span>
        </div>
        
        <div className="legend-divider"></div>
        
        <div className="legend-item">
          <Armchair size={14} color="#94a3b8" />
          <span>Recliner</span>
        </div>
        <div className="legend-item">
          <Users2 size={14} color="#94a3b8" />
          <span>Companion</span>
        </div>
        <div className="legend-item">
          <Crown size={14} color="#94a3b8" />
          <span>VIP</span>
        </div>
      </div>
      
      <div className="seating-container">
        {renderSeatingLayout()}
      </div>
      
      <div className="booking-summary-container">
        <div className="booking-summary">
          <h2>
            <Ticket size={18} />
            <span>Booking Summary</span>
          </h2>
          
          <div className="summary-item">
            <div className="summary-label">Selected Seats</div>
            <div className="summary-value">
              {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'}
            </div>
          </div>
          
          <div className="summary-item">
            <div className="summary-label">
              <Users size={16} />
              <span>Number of Tickets</span>
            </div>
            <div className="summary-value">{selectedSeats.length}</div>
          </div>
          
          <div className="summary-item">
            <div className="summary-label">
              <Tag size={16} />
              <span>Seat Categories</span>
            </div>
            <div className="summary-value">
              {selectedSeatsDetails.map(seat => seat.category)
                .filter((value, index, self) => self.indexOf(value) === index)
                .join(', ') || 'None'}
            </div>
          </div>
          
          <div className="summary-item">
            <div className="summary-label">
              <DollarSign size={16} />
              <span>Subtotal</span>
            </div>
            <div className="summary-value">₹{subtotalAmount.toFixed(2)}</div>
          </div>
          
          {Object.entries(additionalChargesBreakdown).length > 0 && (
            <div className="additional-charges">
              <div className="summary-label">
                <Plus size={16} />
                <span>Additional Charges</span>
              </div>
              
              {Object.entries(additionalChargesBreakdown).map(([type, charge], index) => (
                <div key={`charge-${index}`} className="charge-item">
                  <div className="charge-label">
                    {charge.isPercentage ? (
                      <Percent size={14} />
                    ) : (
                      <Plus size={14} />
                    )}
                    <span>{type}</span>
                    {charge.isPercentage && (
                      <span className="percentage-badge">{charge.originalAmount}%</span>
                    )}
                  </div>
                  <div className="charge-amount">₹{charge.amount.toFixed(2)}</div>
                </div>
              ))}
              
              <div className="charge-item total-charges">
                <div className="charge-label">Total Additional Charges</div>
                <div className="charge-amount">₹{additionalCharges.toFixed(2)}</div>
              </div>
            </div>
          )}
          
          <div className="summary-total">
            <div className="total-label">Total Amount</div>
            <div className="total-value">₹{totalAmount.toFixed(2)}</div>
          </div>
          
          <button 
            className="payment-button" 
            onClick={handleProceedToPayment}
            disabled={selectedSeats.length === 0}
          >
            <CreditCard size={18} />
            <span>Proceed to Payment</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeatBooking;