// Replace your date-related code with this implementation
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { selectUserCity } from '../../../../redux/slices/locationSlice';
import showService from '../../../../services/showService';
import theaterService from '../../../../services/theaterService';
import movieService from '../../../../services/movieService';
import './TheatreListOnMovies.css';

export default function TheatreListOnMovies() {
  const [theaters, setTheaters] = useState([]);
  const [showsByTheater, setShowsByTheater] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [movieDetails, setMovieDetails] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  
  // Get the id parameter from the URL
  const { id } = useParams();
  const userCity = useSelector(selectUserCity);
  const navigate = useNavigate();
  
  // IMPORTANT: Force the date to Indian time zone
  const getCurrentIndianDate = () => {
    // Force Indian time (UTC+5:30) regardless of browser timezone
    const now = new Date();
    
    // Calculate IST time from UTC
    // 1. Convert current time to UTC milliseconds
    const utcMillis = now.getTime();
    
    // 2. Calculate IST offset: UTC+5:30 = 5.5 hours = 5.5 * 60 * 60 * 1000 milliseconds
    const istOffset = 5.5 * 60 * 60 * 1000;
    
    // 3. Calculate current time in IST
    const istTime = new Date(utcMillis + istOffset - (now.getTimezoneOffset() * 60 * 1000));
    
    // 4. Get just the date part in YYYY-MM-DD format
    return istTime.toISOString().split('T')[0];
  };
  
  // Initialize selected date to current Indian date
  const [selectedDate, setSelectedDate] = useState(getCurrentIndianDate());
  
  // Function to fetch theaters and shows for the specific movie
  const fetchTheatersAndShowsForMovie = async () => {
    try {
      setLoading(true);
      
      // Fetch movie details
      const movieData = await movieService.getMovieById(id);
      setMovieDetails(movieData);
      
      const showsData = await showService.getShowsByMovieAndCity(id, userCity, selectedDate);
      
      // The response will be a list of shows, so we need to extract unique theaters
      const theaterMap = new Map();
      const showsMap = {};
      
      // For each show, get the theater details and group shows by theater
      for (const show of showsData) {
        if (!theaterMap.has(show.theaterId)) {
          // Fetch theater details
          const theaterData = await theaterService.getTheaterById(show.theaterId);
          theaterMap.set(show.theaterId, theaterData);
        }
        
        // Group shows by theater ID
        if (!showsMap[show.theaterId]) {
          showsMap[show.theaterId] = [];
        }
        
        // Add show to the theater's show list
        showsMap[show.theaterId].push(show);
      }
      
      // Convert map to array
      const theatersData = Array.from(theaterMap.values());
      setTheaters(theatersData);
      setShowsByTheater(showsMap);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching theaters and shows:', err);
      setError(err.message);
      setLoading(false);
    }
  };
  
  // Generate dates for the next 7 days in Indian time
  useEffect(() => {
    const generateIndianDates = () => {
      const dates = [];
      
      // Get today's date in IST
      const istNow = new Date();
      const utcMillis = istNow.getTime();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const todayIST = new Date(utcMillis + istOffset - (istNow.getTimezoneOffset() * 60 * 1000));
      
      // Generate 7 days from today in IST
      for (let i = 0; i < 7; i++) {
        const date = new Date(todayIST);
        date.setDate(todayIST.getDate() + i);
        
        // Format as YYYY-MM-DD
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
      }
      
      setAvailableDates(dates);
    };
    
    generateIndianDates();
  }, []);
  
  // Fetch theaters whenever selectedDate, userCity or id changes
  useEffect(() => {
    if (userCity && id && selectedDate) {
      fetchTheatersAndShowsForMovie();
    } else {
      setError('Please select a location to view theaters');
      setLoading(false);
    }
  }, [userCity, id, selectedDate]);

  const handleShowClick = (showId) => {
    navigate(`/customer/booking/${showId}`);
  };

  // Format date for display in Indian format
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const dateParts = dateString.split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; // JavaScript months are 0-indexed
    const day = parseInt(dateParts[2]);
    
    const date = new Date(year, month, day);
    
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const weekday = weekdays[date.getDay()];
    const dayNum = date.getDate();
    const monthName = months[date.getMonth()];
    
    return `${weekday}, ${dayNum} ${monthName}`;
  };

  // Format show time
  const formatShowTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };
  
  // Rest of your component code remains the same
  
  // ... getTicketStatusClass, getTicketStatus functions
  
  const getTicketStatusClass = (status) => {
    switch(status) {
      case 'AVAILABLE':
        return 'ticket-status-available';
      case 'FILLING_FAST':
        return 'ticket-status-filling-fast';
      case 'FEW_SEATS_LEFT':
        return 'ticket-status-few-seats';
      case 'SOLD_OUT':
        return 'ticket-status-sold-out';
      default:
        return 'ticket-status-available';
    }
  };
  
  const getTicketStatus = (show) => {
    // This is a placeholder function - in a real app, you'd calculate this based on seat availability
    const availableSeats = show.availableSeats || 0;
    const totalSeats = show.totalSeats || 100;
    const percentage = (availableSeats / totalSeats) * 100;
    
    if (percentage <= 0) return 'SOLD_OUT';
    if (percentage < 10) return 'FEW_SEATS_LEFT';
    if (percentage < 40) return 'FILLING_FAST';
    return 'AVAILABLE';
  };

  // ... render section with loading, error, and content rendering
  
  if (loading) {
    return (
      <div className="movie-theater-list-container">
        <div className="movie-theater-loading">
          <div className="movie-loading-spinner"></div>
          <p>Loading theaters...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="movie-theater-list-container">
        <div className="movie-theater-error">
          <h3>Oops!</h3>
          <p>{error}</p>
          <button 
            className="movie-change-location-btn" 
            onClick={() => navigate('/customer/select-location')}
          >
            Change Location
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="movie-theater-list-container">
      <div className="movie-theater-list-header">
        <h2>
          Theaters showing 
          <span className="filter-movie-title"> {movieDetails?.title || 'this movie'} </span> 
          in <span className="movie-city-name">{userCity}</span>
        </h2>
      </div>
      
      <div className="date-picker-container">
        <div className="date-picker-scroll">
          {availableDates.map((date) => (
            <div 
              key={date} 
              className={`date-option ${selectedDate === date ? 'date-selected' : ''}`}
              onClick={() => setSelectedDate(date)}
            >
              {formatDate(date)}
            </div>
          ))}
        </div>
      </div>
      
      <div className="movie-legend">
        <div className="legend-item">
          <span className="legend-indicator available"></span>
          <span>AVAILABLE</span>
        </div>
        <div className="legend-item">
          <span className="legend-indicator filling-fast"></span>
          <span>FILLING FAST</span>
        </div>
        <div className="legend-item">
          <span className="legend-indicator few-seats"></span>
          <span>FEW SEATS LEFT</span>
        </div>
        <div className="legend-item">
          <span className="legend-indicator sold-out"></span>
          <span>SOLD OUT</span>
        </div>
      </div>
      
      <div className="movie-theaters-list">
        {theaters.map((theater) => (
          <div 
            key={theater.id} 
            className="movie-theater-card"
          >
            <div className="movie-theater-card-header">
              <h3 className="movie-theater-name">{theater.name}</h3>
              <span className={`movie-theater-status ${theater.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                {theater.status}
              </span>
            </div>
            
            <div className="movie-theater-location">
              {theater.location && (
                <>
                  <p>{theater.location.address}</p>
                  <p>{theater.location.city}, {theater.location.state} {theater.location.zipCode}</p>
                  {theater.location.googleLink && (
                    <a 
                      href={theater.location.googleLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="movie-google-maps-link"
                    >
                      View on Google Maps
                    </a>
                  )}
                </>
              )}
            </div>
            
            <div className="movie-theater-info">
              <div className="movie-theater-details">
                <div className="movie-detail-item">
                  <span className="movie-detail-label">Screens:</span>
                  <span className="movie-detail-value">{theater.totalScreens || (theater.screens && theater.screens.length) || 0}</span>
                </div>
                <div className="movie-detail-item">
                  <span className="movie-detail-label">Contact:</span>
                  <span className="movie-detail-value">{theater.phoneNumber || 'N/A'}</span>
                </div>
              </div>
              
              {theater.amenities && theater.amenities.length > 0 && (
                <div className="movie-theater-amenities">
                  {theater.amenities.map((amenity, index) => (
                    <span key={index} className="movie-amenity-badge">
                      {amenity}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="movie-show-times-section">
              <h4>Show Times</h4>
              
              {showsByTheater[theater.id] && showsByTheater[theater.id].length > 0 ? (
                <div className="movie-show-times">
                  {showsByTheater[theater.id].map(show => {
                    const ticketStatus = getTicketStatus(show);
                    return (
                      <button 
                        key={show.id}
                        className={`movie-show-time ${getTicketStatusClass(ticketStatus)}`}
                        onClick={() => handleShowClick(show.id)}
                        disabled={ticketStatus === 'SOLD_OUT'}
                      >
                        <span className="time">{formatShowTime(show.showTime)}</span>
                        <span className="experience-tag">{show.experience || '2D'}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="no-shows-message">No shows available for this date</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}