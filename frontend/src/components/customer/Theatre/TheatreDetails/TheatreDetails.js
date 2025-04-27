import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, ChevronDown, ChevronRight, ArrowLeft } from 'lucide-react';
import './TheatreDetails.css';
import movieService from '../../../../services/movieService';
import theaterService from '../../../../services/theaterService';
import showService from '../../../../services/showService';

const TheatreDetails = () => {
  // Get theatre ID from URL parameters
  const { theatreId } = useParams();
  const navigate = useNavigate();
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theatre, setTheatre] = useState(null);
  const [shows, setShows] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDetails, setShowDetails] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Fetch theatre and shows data based on theatreId
  useEffect(() => {
    const fetchTheatreData = async () => {
      if (!theatreId) {
        setError("Theatre ID is missing");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Fetch theatre data
        const theatreData = await theaterService.getTheaterById(theatreId);
        
        // Fetch shows for this theatre
        const showsData = await showService.getShowsByTheater(theatreId);
        
        // Get unique movie IDs from the shows
        const movieIds = [...new Set(showsData.map(show => show.movieId))];
        
        // Fetch all movie details in parallel
        const moviePromises = movieIds.map(id => movieService.getMovieById(id));
        const moviesData = await Promise.all(moviePromises);
        
        // Create a map of movie IDs to movie objects
        const movieMap = {};
        moviesData.forEach(movie => {
          movieMap[movie.id] = movie;
        });
        
        // Enhance shows with movie details
        const enhancedShows = showsData.map(show => ({
          ...show,
          movieTitle: movieMap[show.movieId]?.title || "Unknown Movie"
        }));
        
        setTheatre(theatreData);
        setShows(enhancedShows);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to load theatre data");
        setLoading(false);
      }
    };
    
    fetchTheatreData();
  }, [theatreId]);
  
  // Generate dates for date selector (today + 4 days)
  const generateDates = () => {
    const dates = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };
  
  const dates = generateDates();
  
  // Formats date to display day name and date
  const formatDateForSelector = (date) => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const dayName = days[date.getDay()];
    const dayNumber = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
    
    return { dayName, dayNumber, month };
  };
  
  // Filter shows by selected date
  const getShowsForDate = (date) => {
    if (!shows || shows.length === 0) return [];
    
    return shows.filter(show => {
      const showDate = new Date(show.showTime);
      return showDate.toDateString() === date.toDateString();
    });
  };
  
  // Group shows by movie
  const groupShowsByMovie = (shows) => {
    const groupedShows = {};
    
    shows.forEach(show => {
      if (!groupedShows[show.movieId]) {
        groupedShows[show.movieId] = {
          movieId: show.movieId,
          movieTitle: show.movieTitle || "Unknown Movie",
          language: show.language,
          screenNumber: show.screenNumber,
          showTimes: []
        };
      }
      
      groupedShows[show.movieId].showTimes.push({
        id: show.id,
        time: new Date(show.showTime),
        endTime: show.endTime ? new Date(show.endTime) : null,
        experience: show.experience,
        availableSeats: show.availableSeats,
        totalSeats: show.totalSeats,
        status: show.status
      });
    });
    
    return Object.values(groupedShows);
  };
  
  const showsForSelectedDate = selectedDate ? getShowsForDate(selectedDate) : [];
  const groupedShows = groupShowsByMovie(showsForSelectedDate);
  
  // Format show time to display in AM/PM format
  const formatShowTime = (time) => {
    if (!time) return '';
    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };
  
  // Get status class for show timing button
  const getStatusClass = (show) => {
    if (!show || !show.status) return '';
    
    switch (show.status) {
      case 'SOLDOUT':
        return 'status-soldout';
      case 'FILLINGFAST':
        return 'status-filling-fast';
      case 'FEWSEATSLEFT':
        return 'status-few-seats';
      case 'OPEN':
        return 'status-open';
      default:
        return '';
    }
  };
  
  // Handle show selection
  const handleShowSelect = (showId) => {
    // Navigate to booking page with selected show
    navigate(`/customer/booking/${showId}`);
  };
  
  // Handle calendar date selection
  const handleCalendarDateSelect = (event) => {
    const selectedDate = new Date(event.target.value);
    setSelectedDate(selectedDate);
    setShowCalendar(false);
  };
  
  // If loading, show loading indicator
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading theatre details...</p>
      </div>
    );
  }
  
  // If error, show error message
  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading Theatre</h2>
        <p>{error}</p>
        <button onClick={() => navigate(-1)} className="back-button">
          <ArrowLeft size={16} /> Go Back
        </button>
      </div>
    );
  }
  
  // If no theatre data, show message
  if (!theatre) {
    return (
      <div className="error-container">
        <h2>Theatre Not Found</h2>
        <p>The theatre you're looking for doesn't exist or has been removed.</p>
        <button onClick={() => navigate('/customer/theatres')} className="back-button">
          <ArrowLeft size={16} /> Browse Theatres
        </button>
      </div>
    );
  }

  return (
    <div className="theatre-details-container">
      {/* Header with theatre name */}
      <div className="theatre-header">
        <div className="theatre-name">
          <h1>{theatre.name}</h1>
        </div>
        
        <div className="theatre-address">
          <MapPin className="location-icon" size={16} />
          <span>
            {theatre.location?.address}, {theatre.location?.city}, {theatre.location?.state}, {theatre.location?.zipCode}
          </span>
          {theatre.location?.googleLink && (
            <a href={theatre.location.googleLink} className="map-link" target="_blank" rel="noopener noreferrer">
              View Map
            </a>
          )}
        </div>
        
        <button 
          className="details-button"
          onClick={() => setShowDetails(!showDetails)}
        >
          Details {showDetails ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        
        {showDetails && (
          <div className="theatre-details-dropdown">
            <div className="amenities">
              <h3>Amenities</h3>
              <div className="amenities-list">
                {theatre.amenities?.map((amenity, index) => (
                  <span key={index} className="amenity-tag">{amenity}</span>
                ))}
              </div>
            </div>
            
            <div className="contact-info">
              <h3>Contact</h3>
              <p>Email: {theatre.emailAddress}</p>
              <p>Phone: {theatre.phoneNumber}</p>
            </div>
            
            <div className="screens-info">
              <h3>Screens</h3>
              <p>Total Screens: {theatre.totalScreens}</p>
              {theatre.screens && (
                <div className="screens-list">
                  {theatre.screens.map((screen, index) => (
                    <div key={index} className="screen-item">
                      Screen {screen.screenNumber}: {screen.screenName}
                      {screen.supportedExperiences && (
                        <div className="experiences">
                          {screen.supportedExperiences.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Date selector with calendar button */}
      <div className="date-selector-wrapper">
        <button 
          className="calendar-button"
          onClick={() => setShowCalendar(!showCalendar)}
        >
          <Calendar size={16} />
        </button>
        
        {showCalendar && (
          <div className="calendar-dropdown">
            <input 
              type="date" 
              onChange={handleCalendarDateSelect}
              min={new Date().toISOString().split('T')[0]}
              className="calendar-input"
            />
          </div>
        )}
        
        <div className="date-selector">
          {dates.map((date, index) => {
            const { dayName, dayNumber, month } = formatDateForSelector(date);
            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
            
            return (
              <div 
                key={index} 
                className={`date-item ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedDate(date)}
              >
                <div className="day-name">{dayName}</div>
                <div className="day-number">{dayNumber}</div>
                <div className="month">{month}</div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Updated Legend */}
      <div className="legend">
        <div className="legend-item">
          <span className="dot status-open"></span> AVAILABLE
        </div>
        <div className="legend-item">
          <span className="dot status-filling-fast"></span> FILLING FAST
        </div>
        <div className="legend-item">
          <span className="dot status-few-seats"></span> FEW SEATS LEFT
        </div>
        <div className="legend-item">
          <span className="dot status-soldout"></span> SOLD OUT
        </div>
      </div>
      
      {/* Shows listing */}
      <div className="shows-container">
        {groupedShows.length > 0 ? (
          groupedShows.map((movie, index) => (
            <div key={index} className="tdetails-movie-shows">
              <div className="tdetails-movie-show-row">
                <div className="tdetails-movie-info">
                  <h2>{movie.movieTitle}</h2>
                  <div className="tdetails-movie-meta">
                    <span className="language">{movie.language}</span>
                  </div>
                </div>
                
                <div className="show-times-list">
                  {movie.showTimes.map((show, idx) => (
                    <button 
                      key={idx} 
                      className={`show-time-btn ${getStatusClass(show)}`}
                      disabled={show.status === 'SOLDOUT'}
                      onClick={() => handleShowSelect(show.id)}
                    >
                      {formatShowTime(show.time)}
                      {show.experience && <span className="experience">{show.experience}</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-shows-message">
            <p>No shows available for selected date</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TheatreDetails;