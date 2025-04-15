import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ShowService from '../../../../services/showService';
import BookingService from '../../../../services/bookingService';
import TheaterService from '../../../../services/theaterService';
import './SeatBooking.css';

const SeatBooking = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(null);
  const [theater, setTheater] = useState(null);
  const [screen, setScreen] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [reservedSeats, setReservedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(300); // 5 minutes timer
  const [timerActive, setTimerActive] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [bookingId, setBookingId] = useState(null);

  // Fetch show details, theater details, and booked seats
  useEffect(() => {
    const fetchShowDetails = async () => {
      try {
        setLoading(true);
        // Get show details
        const showResponse = await ShowService.getShowById(showId);
        setShow(showResponse);
        
        // Get theater details
        const theaterResponse = await TheaterService.getTheaterById(showResponse.theaterId);
        setTheater(theaterResponse);
        
        // Get screen details
        const screenResponse = await TheaterService.getScreenByNumber(
          showResponse.theaterId, 
          showResponse.screenId
        );
        setScreen(screenResponse);
        
        // Get all booked seats for this show
        const bookedResponse = await BookingService.getBookedSeats(showId);
        setBookedSeats(bookedResponse);
        
        // Get all reserved seats for this show (temporary holds)
        const reservedResponse = await BookingService.getReservedSeats(showId);
        setReservedSeats(reservedResponse);
        
        setLoading(false);
      } catch (error) {
        toast.error('Failed to load show details');
        console.error(error);
        setLoading(false);
      }
    };

    fetchShowDetails();
    
    // Set up polling to check for newly booked/reserved seats every 10 seconds
    const interval = setInterval(async () => {
      try {
        const bookedResponse = await BookingService.getBookedSeats(showId);
        setBookedSeats(bookedResponse);
        
        const reservedResponse = await BookingService.getReservedSeats(showId);
        setReservedSeats(reservedResponse.filter(seat => 
          !bookedResponse.includes(seat)
        ));
      } catch (error) {
        console.error('Error refreshing seat status:', error);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [showId]);

  // Timer logic
  useEffect(() => {
    let intervalId;
    
    if (timerActive && timer > 0) {
      intervalId = setInterval(() => {
        setTimer(prevTimer => prevTimer - 1);
      }, 1000);
    } else if (timer === 0 && selectedSeats.length > 0) {
      // Timer expired, release the seats
      handleReleaseSeats();
    }
    
    return () => clearInterval(intervalId);
  }, [timerActive, timer]);

  // Calculate total price whenever selected seats change
  useEffect(() => {
    if (show && selectedSeats.length > 0) {
      const price = selectedSeats.reduce((total, seatId) => {
        const seat = show.seats.find(s => s.id === seatId);
        return total + (seat ? seat.price : 0);
      }, 0);
      setTotalPrice(price);
      
      // Start timer when seats are selected
      if (selectedSeats.length > 0 && !timerActive) {
        setTimerActive(true);
      }
    } else {
      setTotalPrice(0);
      if (selectedSeats.length === 0) {
        setTimerActive(false);
        setTimer(300); // Reset timer
      }
    }
  }, [selectedSeats, show]);

  const handleSeatClick = async (seatId) => {
    if (bookedSeats.includes(seatId) || reservedSeats.includes(seatId)) {
      return; // Seat is already booked or reserved
    }
    
    if (selectedSeats.includes(seatId)) {
      // Deselect the seat
      setSelectedSeats(prevSelected => prevSelected.filter(id => id !== seatId));
      
      // Release this seat from reservation if it was reserved
      try {
        await BookingService.releaseSeat(showId, seatId);
      } catch (error) {
        console.error('Error releasing seat:', error);
      }
    } else {
      // Select the seat and reserve it
      try {
        const response = await BookingService.reserveSeat(showId, seatId);
        if (response.status === 200) {
          setSelectedSeats(prevSelected => [...prevSelected, seatId]);
          setReservedSeats(prevReserved => [...prevReserved, seatId]);
          
          // If this is the first seat being selected, create a temporary booking
          if (selectedSeats.length === 0) {
            const bookingResponse = await BookingService.createTemporaryBooking(showId);
            setBookingId(bookingResponse.id);
          }
        } else {
          toast.error('This seat was just taken by another user');
          // Refresh booked/reserved seats
          const bookedResponse = await BookingService.getBookedSeats(showId);
          setBookedSeats(bookedResponse);
          const reservedResponse = await BookingService.getReservedSeats(showId);
          setReservedSeats(reservedResponse);
        }
      } catch (error) {
        toast.error('Failed to reserve seat');
        console.error(error);
      }
    }
  };

  const handleReleaseSeats = async () => {
    if (selectedSeats.length > 0) {
      try {
        await BookingService.releaseSeats(showId, selectedSeats);
        setSelectedSeats([]);
        setTimerActive(false);
        setTimer(300); // Reset timer to 5 minutes
        toast.info('Your seat selection has expired');
        
        // Refresh booked/reserved seats
        const bookedResponse = await BookingService.getBookedSeats(showId);
        setBookedSeats(bookedResponse);
        const reservedResponse = await BookingService.getReservedSeats(showId);
        setReservedSeats(reservedResponse);
      } catch (error) {
        console.error('Error releasing seats:', error);
      }
    }
  };

  const handleProceedToPayment = async () => {
    if (selectedSeats.length === 0) {
      toast.warning('Please select at least one seat');
      return;
    }
    
    try {
      // Convert selected seats to confirmed reservation
      const response = await BookingService.confirmReservation(showId, selectedSeats, bookingId);
      
      if (response.status === 200) {
        // Redirect to payment page with booking ID
        navigate(`/payment/${bookingId}`);
      } else {
        toast.error('Some seats were already taken. Please try again.');
        // Refresh seats
        const bookedResponse = await BookingService.getBookedSeats(showId);
        setBookedSeats(bookedResponse);
        // Remove any seats that are now booked from selection
        setSelectedSeats(prev => prev.filter(seatId => !bookedResponse.includes(seatId)));
      }
    } catch (error) {
      toast.error('Failed to confirm reservation');
      console.error(error);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const getSeatStatus = (seatId) => {
    if (bookedSeats.includes(seatId)) return 'booked';
    if (reservedSeats.includes(seatId) && !selectedSeats.includes(seatId)) return 'reserved';
    if (selectedSeats.includes(seatId)) return 'selected';
    return 'available';
  };

  const renderSeats = () => {
    if (!screen || !show) return null;
    
    // Use the screen.seatMatrix from your actual model
    const { rows, columns, seatMatrix } = screen;
    
    // Empty array to hold the rows of seats
    const seatRows = [];
    
    // Loop through each row
    for (let i = 0; i < rows; i++) {
      const rowSeats = [];
      
      // Add the row label (A, B, C, etc.)
      rowSeats.push(
        <div key={`row-label-${i}`} className="row-label">
          {String.fromCharCode(65 + i)}
        </div>
      );
      
      // Loop through each column
      for (let j = 0; j < columns; j++) {
        const seatValue = seatMatrix[i][j];
        
        // Check what the value represents
        if (seatValue === 0) {
          // Empty space
          rowSeats.push(
            <div key={`seat-${i}-${j}`} className="seat-placeholder"></div>
          );
        } else if (seatValue === -1) {
          // Aisle
          rowSeats.push(
            <div key={`seat-${i}-${j}`} className="seat-aisle"></div>
          );
        } else {
          // This is a seat
          // Find the seat in the show's seat list
          const seatId = `${String.fromCharCode(65 + i)}${j + 1}`;
          const seat = show.seats.find(s => s.seatNumber === seatId);
          
          if (seat) {
            const status = getSeatStatus(seat.id);
            rowSeats.push(
              <button
                key={`seat-${i}-${j}`}
                className={`seat ${status} ${seat.category.toLowerCase()}`}
                onClick={() => handleSeatClick(seat.id)}
                disabled={status === 'booked' || status === 'reserved'}
                title={`${seat.seatNumber} - ${seat.category} - ₹${seat.price}`}
              >
                {j + 1}
              </button>
            );
          } else {
            // If for some reason there's no matching seat in the show data
            rowSeats.push(
              <div key={`seat-${i}-${j}`} className="seat-placeholder"></div>
            );
          }
        }
      }
      
      // Add the completed row to the seatRows array
      seatRows.push(
        <div key={`row-${i}`} className="seat-row">
          {rowSeats}
        </div>
      );
    }
    
    return (
      <div className="seating-layout">
        {seatRows}
      </div>
    );
  };

  if (loading) {
    return <div className="loading-container">Loading seat map...</div>;
  }

  if (!show || !screen) {
    return <div className="error-container">Show or screen details not found</div>;
  }

  // Get unique categories for the legend
  const uniqueCategories = [...new Set(show.seats.map(seat => seat.category))];

  return (
    <div className="seat-booking-container">
      <h2>{show.movie.title} - {show.screenTime}</h2>
      <h3 className="theater-info">{theater ? theater.name : ''} - {screen.screenName}</h3>
      
      {timerActive && (
        <div className="timer-container">
          <p>Time remaining to complete booking: <span className="timer">{formatTime(timer)}</span></p>
        </div>
      )}
      
      <div className="screen-container">
        <div className="screen">SCREEN</div>
      </div>
      
      <div className="seats-legend">
        <div className="legend-item">
          <div className="seat-example available"></div>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="seat-example selected"></div>
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
        
        {/* Category legends */}
        {uniqueCategories.map(category => (
          <div key={`legend-${category}`} className="legend-item">
            <div className={`seat-example category ${category.toLowerCase()}`}></div>
            <span>{category}</span>
          </div>
        ))}
      </div>
      
      {renderSeats()}
      
      <div className="booking-summary">
        <h3>Booking Summary</h3>
        <p>Selected Seats: {selectedSeats.length > 0 ? 
          selectedSeats.map(seatId => {
            const seat = show.seats.find(s => s.id === seatId);
            return seat ? seat.seatNumber : '';
          }).join(', ') : 'None'}
        </p>
        <p>Total Price: ₹{totalPrice}</p>
        
        <button 
          className="payment-button"
          onClick={handleProceedToPayment}
          disabled={selectedSeats.length === 0}
        >
          Proceed to Payment
        </button>
      </div>
    </div>
  );
};

export default SeatBooking;