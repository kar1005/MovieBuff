import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Clock, CreditCard, Info, Monitor, Users, ArrowLeft } from 'lucide-react';
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
  const [seatCategories, setSeatCategories] = useState([]);
  const [categoryColors, setCategoryColors] = useState({});
  const [movieTitle, setMovieTitle] = useState('');

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
            // Use the movieService instead of direct fetch
            const movieData = await movieService.getMovieById(showData.movieId);
            if (movieData) {
              setMovieTitle(movieData.title);
            }
          } catch (err) {
            console.error("Error fetching movie details:", err);
            // Continue even if movie details can't be fetched
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
              colors[section.categoryName] = section.color || '#cbd5e1';
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
      calculateTotalAmount();
      
      // Start timer if not already active
      if (!timerActive) {
        setTimerActive(true);
      }
    } else if (selectedSeats.length === 0) {
      setTotalAmount(0);
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

  // Calculate total amount for selected seats
  const calculateTotalAmount = () => {
    if (!show || !show.pricing) return;
    
    let total = 0;
    selectedSeats.forEach(seatId => {
      // Find seat in the screen layout
      const foundSeat = findSeatById(seatId);
      if (foundSeat && foundSeat.category) {
        // Get price from show pricing
        const pricing = show.pricing[foundSeat.category];
        if (pricing && pricing.finalPrice) {
          total += pricing.finalPrice;
        }
      }
    });
    
    setTotalAmount(total);
  };

  // Find seat information by ID
  const findSeatById = (seatId) => {
    if (!screen || !screen.layout || !screen.layout.sections) return null;
    
    // Iterate through sections and seats to find the matching seat
    for (const section of screen.layout.sections) {
      if (section.seats) {
        // Match based on the seatNumber (like "A1")
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
      // First, confirm the reservation
      const response = await bookingService.confirmReservation(showId, selectedSeats, bookingId);
      
      // Navigate to payment page with booking ID
      navigate(`/customer/payment/${response.id}`);
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
                seatColor: section.color || '#cbd5e1',
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
                
                return (
                  <button
                    key={`seat-${seatId}`}
                    className={`seat ${statusClass} ${categoryClass}`}
                    onClick={() => handleSeatClick(seatId)}
                    disabled={statusClass === 'booked' || statusClass === 'reserved'}
                    aria-label={`Seat ${seatId}`}
                    title={`${seatId} - ${seat.category} - ₹${show.pricing[seat.category]?.finalPrice || seat.basePrice}`}
                    style={
                      statusClass === 'selected' 
                        ? { backgroundColor: seat.seatColor, borderColor: seat.seatColor, color: '#ffffff' } 
                        : { borderColor: seat.seatColor }
                    }
                  >
                    {seatId.substring(1)} {/* Just show the number part, not the row letter */}
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
      <div className="container my-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading seat layout...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container my-5 text-center">
        <div className="alert alert-danger">
          <Info size={24} className="mb-2" />
          <p>{error}</p>
          <button className="btn btn-outline-danger mt-3" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Return the seat booking UI
  return (
    <div className="seat-booking-container container py-4">
      <div className="row">
        <div className="col-12">
          <button 
            className="btn btn-outline-secondary mb-3"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} />
            <span className="ms-1">Back</span>
          </button>
          <h2 className="text-center mb-1">{movieTitle || 'Movie Title'}</h2>
          <h5 className="text-center text-muted mb-2">
            {theater?.name || 'Theater'} | Screen {screen?.screenNumber || ''} | {show && new Date(show.showTime).toLocaleString()}
          </h5>
          <div className="text-center mb-4">
            <span className="badge bg-secondary me-2">{show?.language}</span>
            <span className="badge bg-info">{show?.experience}</span>
          </div>
        </div>
      </div>
      
      {timerActive && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="timer-banner">
              <Clock size={18} />
              <span>Booking will expire in: </span>
              <strong>{formatTime(timer)}</strong>
            </div>
          </div>
        </div>
      )}
      
      <div className="row mb-4">
        <div className="col-12">
          <div className="screen-container">
            <div className="screen">
              <Monitor size={18} />
              <span>SCREEN</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row mb-4">
        <div className="col-12">
          <div className="seat-legend">
            <div className="legend-item">
              <div className="seat-example available"></div>
              <span>Available</span>
            </div>
            <div className="legend-item">
              <div className="seat-example selected" style={{ backgroundColor: '#3b82f6', borderColor: '#1d4ed8' }}></div>
              <span>Selected</span>
            </div>
            <div className="legend-item">
              <div className="seat-example booked"></div>
              <span>Booked</span>
            </div>
            <div className="legend-item">
              <div className="seat-example reserved"></div>
              <span>Reserved</span>
            </div>
            
            {/* Render category legends */}
            {seatCategories.map(category => (
              <div key={`legend-${category}`} className="legend-item">
                <div 
                  className="seat-example category"
                  style={{ borderColor: categoryColors[category] || '#cbd5e1' }}
                ></div>
                <span>{category} (₹{show?.pricing[category]?.finalPrice})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="row mb-4">
        <div className="col-12 seating-container">
          {renderSeatingLayout()}
        </div>
      </div>
      
      <div className="row">
        <div className="col-12 col-md-6 offset-md-3">
          <div className="booking-summary">
            <h3>Booking Summary</h3>
            
            <div className="summary-item">
              <span className="label">Selected Seats:</span>
              <span className="value">
                {selectedSeats.length > 0 
                  ? selectedSeats.join(', ')
                  : 'None'}
              </span>
            </div>
            
            <div className="summary-item">
              <span className="label">Number of Tickets:</span>
              <span className="value">
                <Users size={16} className="me-1" />
                {selectedSeats.length}
              </span>
            </div>
            
            <div className="summary-item">
              <span className="label">Seat Categories:</span>
              <span className="value">
                {selectedSeats.map(seatId => {
                  const seat = findSeatById(seatId);
                  return seat ? seat.category : '';
                }).filter(Boolean).join(', ') || 'None'}
              </span>
            </div>
            
            <div className="summary-item total">
              <span className="label">Total Amount:</span>
              <span className="value">₹{totalAmount.toFixed(2)}</span>
            </div>
            
            <button 
              className="btn-proceed mt-3" 
              onClick={handleProceedToPayment}
              disabled={selectedSeats.length === 0}
            >
              <CreditCard size={18} />
              Proceed to Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatBooking;