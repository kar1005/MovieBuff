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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);
  
  // Get the id parameter from the URL
  const { id } = useParams();
  const userCity = useSelector(selectUserCity);
  const navigate = useNavigate();
  
  // Function to fetch all necessary data
  const fetchData = async () => {
    try {
      console.log("Fetching data for movie:", id, "city:", userCity, "date:", selectedDate);
      
      setLoading(true);
      setError(null);
      
      // Only fetch movie details once - doesn't change with date
      if (!movieDetails) {
        const movieData = await movieService.getMovieById(id);
        setMovieDetails(movieData);
      }
      
      // Fetch shows for the selected movie, city and date
      const showsData = await showService.getShowsByMovieAndCity(id, userCity, selectedDate);
      console.log("Shows data received:", showsData);
      
      if (!showsData || showsData.length === 0) {
        setTheaters([]);
        setShowsByTheater({});
        setLoading(false);
        return;
      }
      
      // Extract unique theater IDs
      const theaterIds = [...new Set(showsData.map(show => show.theaterId))];
      
      // Fetch all theater details in parallel
      const theaterPromises = theaterIds.map(theaterId => 
        theaterService.getTheaterById(theaterId)
      );
      
      const theatersData = await Promise.all(theaterPromises);
      
      // Group shows by theater ID
      const showsMap = {};
      for (const show of showsData) {
        if (!showsMap[show.theaterId]) {
          showsMap[show.theaterId] = [];
        }
        showsMap[show.theaterId].push(show);
      }
      
      setTheaters(theatersData);
      setShowsByTheater(showsMap);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load theaters and shows');
    } finally {
      setLoading(false);
    }
  };
  
  // Generate dates for the next 7 days
  useEffect(() => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    setAvailableDates(dates);
  }, []);
  
  // Fetch data when component mounts or when dependencies change
  useEffect(() => {
    if (userCity && id) {
      fetchData();
    } else {
      setError('Please select a location to view theaters');
      setLoading(false);
    }
  }, [userCity, id, selectedDate]);

  const handleShowClick = (showId) => {
    navigate(`/customer/booking/${showId}`);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const toggleModal = () => {
    setModalOpen(!modalOpen);
  };
  
  const renderAmenities = (amenities) => {
    if (!amenities || amenities.length === 0) return null;
    
    return (
      <div className="movie-theater-amenities">
        {amenities.map((amenity, index) => (
          <span key={index} className="movie-amenity-badge">
            {amenity}
          </span>
        ))}
      </div>
    );
  };
  
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
    // For now, we'll simulate various statuses
    const availableSeats = show.availableSeats || 0;
    const totalSeats = show.totalSeats || 100;
    const percentage = (availableSeats / totalSeats) * 100;
    
    if (percentage <= 0) return 'SOLD_OUT';
    if (percentage < 10) return 'FEW_SEATS_LEFT';
    if (percentage < 40) return 'FILLING_FAST';
    return 'AVAILABLE';
  };

  const formatShowTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };
  
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
        {theaters.length > 0 ? (
          theaters.map((theater) => (
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
                
                {renderAmenities(theater.amenities)}
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
          ))
        ) : (
          <div className="movie-no-theaters">
            <h3>No theaters showing {movieDetails?.title || 'this movie'} in {userCity} on {formatDate(selectedDate)}</h3>
            <p>Try selecting a different date or location.</p>
          </div>
        )}
      </div>
    </div>
  );
}