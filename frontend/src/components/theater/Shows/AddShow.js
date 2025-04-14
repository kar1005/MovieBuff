import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Card, Row, Col, InputGroup, Alert, ListGroup, Spinner, Badge } from 'react-bootstrap';
import TimePicker  from './TimePicker';
import { 
  Calendar, 
  Clock, 
  Film, 
  Trash2, 
  Plus, 
  Search, 
  Monitor, 
  Languages, 
  Award, 
  Info, 
  AlertTriangle,
  DollarSign
} from 'lucide-react';
import { toast } from 'react-toastify';

import { createShow, getShowsByTheaterAndScreen } from '../../../redux/slices/showSlice';
import { getAllMovies } from '../../../redux/slices/movieSlice';
import { fetchManagerTheaters, fetchTheaterScreens } from '../../../redux/slices/theaterSlice';

const AddShow = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Refs for components
  const movieInputRef = useRef(null);
  
  // Redux state
  const { currentTheater, screens, loading: theaterLoading } = useSelector(state => state.theater);
  const { movies, loading: moviesLoading } = useSelector(state => state.movies);
  const { showsByScreen, isLoading: showLoading } = useSelector(state => state.shows);
  const { id: managerId } = useSelector(state => state.auth);

  // Local state
  const [showData, setShowData] = useState({
    movieId: '',
    theaterId: '',
    screenNumber: '',
    showDate: formatDateForInput(new Date()),
    showTime: '',
    language: '',
    experience: '',
    cleanupTime: 15,
    intervalTime: 15,
    
    // Common additional charges
    commonCharges: [
      { type: 'CONVENIENCE_FEE', amount: 30, isPercentage: false },
      { type: 'GST', amount: 18, isPercentage: true }
    ],
    
    // Previous fields
    experienceOptions: [],
    unavailableTimes: [],
    screenSections: [],
    
    // Number input fields
    intervalTimeMin: 0,
    intervalTimeMax: 30,
    cleanupTimeMin: 10,
    cleanupTimeMax: 30
  });
  
  // Movie search functionality
  const [movieSearchTerm, setMovieSearchTerm] = useState('');
  const [showMovieDropdown, setShowMovieDropdown] = useState(false);
  const [filteredMovies, setFilteredMovies] = useState([]);
  
  // Error handling
  const [timeConflictError, setTimeConflictError] = useState(false);
  const [errorMessages, setErrorMessages] = useState([]);
  
  // Schedule visualization
  const [scheduleTimeline, setScheduleTimeline] = useState([]);

  // Generate time slots in 15-minute increments
  const timeSlots = [];
  for (let hour = 9; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const formattedHour = hour.toString().padStart(2, '0');
      const formattedMinute = minute.toString().padStart(2, '0');
      timeSlots.push(`${formattedHour}:${formattedMinute}`);
    }
  }

  // Utility functions
  function formatDateForInput(date) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }

  function createLocalDateTime(dateString, timeString) {
    // Parse the date and time
    const [year, month, day] = dateString.split('-').map(Number);
    const [hours, minutes] = timeString.split(':').map(Number);
    
    // Create a date object
    const date = new Date(year, month - 1, day, hours, minutes);
    
    // Adjust for timezone offset to ensure the correct time is sent to backend
    const timezoneOffset = date.getTimezoneOffset();
    date.setMinutes(date.getMinutes() - timezoneOffset);
    
    // Format the date as an ISO string without modifying the time
    const formattedDate = date.toISOString();
    
    return formattedDate;
  }
  
  function convertUTCtoIST(utcDateString) {
    const date = new Date(utcDateString);
    // Add 5 hours 30 minutes for IST
    date.setHours(date.getHours() + 5);
    date.setMinutes(date.getMinutes() + 30);
    return date;
  }

  function calculateFinalPrice(basePrice, additionalCharges) {
    let finalPrice = basePrice;
    
    additionalCharges.forEach(charge => {
      if (charge.isPercentage) {
        finalPrice += (basePrice * charge.amount) / 100;
      } else {
        finalPrice += charge.amount;
      }
    });
    
    return Math.round(finalPrice);
  }
  
  function formatTimeDisplay(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // Check for time conflicts
  function checkTimeConflicts() {
    if (!showData.showTime || !showData.showDate || !showData.movieId) {
      return false;
    }
    
    const selectedMovie = movies.find(m => m.id === showData.movieId);
    if (!selectedMovie) return false;
    
    // Create a date object in local timezone
    const [year, month, day] = showData.showDate.split('-').map(Number);
    const [hours, minutes] = showData.showTime.split(':').map(Number);
    const startDateTime = new Date(year, month - 1, day, hours, minutes);
    
    // Calculate end time based on movie duration, interval, and cleanup
    const totalDuration = selectedMovie.duration + 
      (showData.intervalTime || 0) + 
      (showData.cleanupTime || 0);
    
    const endDateTime = new Date(startDateTime.getTime() + totalDuration * 60000);
    
    // Convert existing show times from UTC to local time for accurate comparison
    const conflicts = showsByScreen.filter(show => {
      // Convert UTC show times to local time
      const showStartTime = new Date(show.showTime);
      const showEndTime = new Date(show.endTime);
      
      // Check for conflicts
      const conflictA = startDateTime >= showStartTime && startDateTime < showEndTime;
      const conflictB = endDateTime > showStartTime && endDateTime <= showEndTime;
      const conflictC = startDateTime <= showStartTime && endDateTime >= showEndTime;
      
      return conflictA || conflictB || conflictC;
    });
    
    if (conflicts.length > 0) {
      setTimeConflictError(true);
      const messages = conflicts.map(show => 
        `Conflicts with "${show.movie?.title}" (${formatTimeDisplay(show.showTime)} - ${formatTimeDisplay(show.endTime)})`
      );
      setErrorMessages(messages);
      return true;
    } else {
      setTimeConflictError(false);
      setErrorMessages([]);
      return false;
    }
  }

  // Input change handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShowData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Movie search handlers
  const handleMovieSearch = (e) => {
    const searchTerm = e.target.value;
    setMovieSearchTerm(searchTerm);
    
    if (searchTerm.trim() === '') {
      setFilteredMovies([]);
      setShowMovieDropdown(false);
      return;
    }
    
    // Filter only released movies
    const filtered = movies.filter(movie => 
      movie.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      movie.status === 'RELEASED'
    );
    
    setFilteredMovies(filtered);
    setShowMovieDropdown(true);
  };
  
  const handleMovieSelect = (movie) => {
    setShowData(prev => ({
      ...prev,
      movieId: movie.id
    }));
    setMovieSearchTerm(movie.title);
    setShowMovieDropdown(false);
  };
  
  // Handle document click to close movie dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (movieInputRef.current && !movieInputRef.current.contains(event.target)) {
        setShowMovieDropdown(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Number input handlers
  const handleNumberIncrement = (field) => {
    setShowData(prev => ({
      ...prev,
      [field]: Math.min(prev[field] + 1, prev[`${field}Max`])
    }));
  };

  const handleNumberDecrement = (field) => {
    setShowData(prev => ({
      ...prev,
      [field]: Math.max(prev[field] - 1, prev[`${field}Min`])
    }));
  };

  // Common charges handlers
  const addCommonCharge = () => {
    setShowData(prev => ({
      ...prev,
      commonCharges: [
        ...prev.commonCharges,
        { type: '', amount: 0, isPercentage: false }
      ]
    }));
  };

  const updateCommonCharge = (index, field, value) => {
    const newCharges = [...showData.commonCharges];
    newCharges[index][field] = field === 'isPercentage' ? value : (field === 'amount' ? parseFloat(value) : value);
    setShowData(prev => ({
      ...prev,
      commonCharges: newCharges
    }));
  };

  const removeCommonCharge = (index) => {
    const newCharges = showData.commonCharges.filter((_, i) => i !== index);
    setShowData(prev => ({
      ...prev,
      commonCharges: newCharges
    }));
  };

  // Pricing change handler
  const handlePriceChange = (categoryName, value) => {
    const basePrice = parseFloat(value);
    
    setShowData(prev => {
      // Calculate final price
      const finalPrice = calculateFinalPrice(basePrice, prev.commonCharges);
      
      return {
        ...prev,
        pricing: {
          ...prev.pricing,
          [categoryName]: {
            ...prev.pricing?.[categoryName],
            categoryName,
            basePrice,
            finalPrice,
            additionalCharges: [...prev.commonCharges]
          }
        }
      };
    });
  };

  // Create a visual representation of the day's schedule
  const generateScheduleTimeline = () => {
    if (!showsByScreen || !showsByScreen.length) return [];
    
    // Sort shows by start time
    const sortedShows = [...showsByScreen].sort((a, b) => {
      const dateA = new Date(a.showTime);
      const dateB = new Date(b.showTime);
      return dateA - dateB;
    });
    
    // Create timeline items with percentage width based on show duration
    const timelineItems = sortedShows.map(show => {
      // Calculate show duration in minutes
      const startTime = new Date(show.showTime);
      const endTime = new Date(show.endTime);
      const durationMinutes = (endTime - startTime) / (1000 * 60);
      
      // Calculate position in 24-hour day (0-1440 minutes)
      const minutesSinceMidnight = startTime.getHours() * 60 + startTime.getMinutes();
      const leftPosition = (minutesSinceMidnight / 1440) * 100;
      
      // Calculate width as percentage of day
      const widthPercentage = (durationMinutes / 1440) * 100;

      // Get movie title from show
      const movieTitle = show.movie?.title || "Unknown Movie";
      
      return {
        id: show.id,
        title: movieTitle,
        startTime: formatTimeDisplay(startTime),
        endTime: formatTimeDisplay(endTime),
        leftPosition,
        widthPercentage,
      };
    });
    
    return timelineItems;
  };

  // Data loading effects
  useEffect(() => {
    if (managerId) {
      dispatch(fetchManagerTheaters(managerId));
      // Get movies that are RELEASED
      dispatch(getAllMovies({ filters: { status: 'RELEASED' } }));
    }
  }, [dispatch, managerId]);

  useEffect(() => {
    if (currentTheater?.id) {
      dispatch(fetchTheaterScreens(currentTheater.id));
      setShowData(prev => ({
        ...prev,
        theaterId: currentTheater.id
      }));
    }
  }, [dispatch, currentTheater]);

  // Screen and shows conflict checking - Enhanced to trigger on screen or date change
  useEffect(() => {
    if (currentTheater?.id && showData.screenNumber && showData.showDate) {
      try {
        // Format dates correctly for the backend (without time zone)
        const selectedDate = new Date(showData.showDate);
        
        // Format as 'YYYY-MM-DDT00:00:00' without timezone suffix
        const startOfDay = `${showData.showDate}T00:00:00`;
        const endOfDay = `${showData.showDate}T23:59:59`;
        
        console.log("Fetching shows for date range:", { startOfDay, endOfDay });
        
        // Fetch shows for the selected theater, screen, and date
        dispatch(getShowsByTheaterAndScreen({
          theaterId: currentTheater.id,
          screenNumber: parseInt(showData.screenNumber),
          startTime: startOfDay,
          endTime: endOfDay
        }))
        .unwrap()
        .then(() => {
          console.log("Successfully fetched shows for the selected date and screen");
        })
        .catch(error => {
          console.error("Error fetching shows for timeline:", error);
          
          // Extract and format the error message properly
          let errorMessage = "Failed to load schedule timeline";
          
          if (error && typeof error === 'object') {
            // Try to extract message from API error response
            if (error.message) {
              errorMessage = error.message;
            } else if (error.data && error.data.message) {
              errorMessage = error.data.message;
            } else if (error.status && error.statusText) {
              errorMessage = `Error ${error.status}: ${error.statusText}`;
            }
          } else if (typeof error === 'string') {
            errorMessage = error;
          }
          
          toast.error(errorMessage);
        });
      } catch (err) {
        console.error("Error preparing timeline request:", err);
        toast.error("Failed to prepare schedule timeline request");
      }
    }
  }, [dispatch, currentTheater, showData.screenNumber, showData.showDate]);

  // Generate schedule timeline when shows are loaded
  useEffect(() => {
    if (showsByScreen) {
      const timeline = generateScheduleTimeline();
      setScheduleTimeline(timeline);
    } else {
      setScheduleTimeline([]);
    }
  }, [showsByScreen]);

  // Check for time conflicts when relevant data changes
  useEffect(() => {
    if (showsByScreen?.length > 0 && showData.showTime && showData.movieId) {
      checkTimeConflicts();
    }
  }, [showsByScreen, showData.showTime, showData.movieId, showData.intervalTime, showData.cleanupTime]);

  // Movie and experience selection effects
  useEffect(() => {
    if (showData.movieId && currentTheater?.id && showData.screenNumber) {
      const selectedMovie = movies.find(m => m.id === showData.movieId);
      if (selectedMovie && !movieSearchTerm) {
        setMovieSearchTerm(selectedMovie.title);
      }
      
      const selectedScreen = screens?.[currentTheater.id]?.find(
        s => s.screenNumber === parseInt(showData.screenNumber)
      );

      // Get compatible experiences
      const movieExperiences = selectedMovie?.experience || [];
      const screenExperiences = selectedScreen?.supportedExperiences || [];
      const compatibleExperiences = movieExperiences.filter(
        exp => screenExperiences.includes(exp)
      );

      // Update screen sections and pricing
      if (selectedScreen?.layout?.sections) {
        const sections = selectedScreen.layout.sections;
        const initialPricing = sections.reduce((acc, section) => {
          const basePrice = section.basePrice || 100;
          const finalPrice = calculateFinalPrice(basePrice, showData.commonCharges);
          
          acc[section.categoryName] = {
            categoryName: section.categoryName,
            basePrice,
            finalPrice,
            additionalCharges: [...showData.commonCharges]
          };
          return acc;
        }, {});

        setShowData(prev => ({
          ...prev,
          experienceOptions: compatibleExperiences,
          screenSections: sections,
          pricing: initialPricing
        }));
      }
    }
  }, [showData.movieId, currentTheater, showData.screenNumber, movies, screens]);

  // Update pricing when common charges change
  useEffect(() => {
    if (showData.pricing) {
      const updatedPricing = Object.keys(showData.pricing).reduce((acc, key) => {
        const item = showData.pricing[key];
        const basePrice = item.basePrice;
        const finalPrice = calculateFinalPrice(basePrice, showData.commonCharges);
        
        acc[key] = {
          ...item,
          finalPrice,
          additionalCharges: [...showData.commonCharges]
        };
        return acc;
      }, {});
      
      setShowData(prev => ({
        ...prev,
        pricing: updatedPricing
      }));
    }
  }, [showData.commonCharges]);

  // Form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!showData.movieId || !showData.screenNumber || 
        !showData.showDate || !showData.showTime || 
        !showData.language || !showData.experience) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Check for time conflicts
    if (checkTimeConflicts()) {
      toast.error('Show timing conflicts with existing shows');
      return;
    }
    
    // Convert pricing object to expected format for backend
    const formattedPricing = {};
    if (showData.pricing) {
      Object.values(showData.pricing).forEach(item => {
        formattedPricing[item.categoryName] = {
          categoryName: item.categoryName,
          basePrice: item.basePrice,
          additionalCharges: item.additionalCharges,
          finalPrice: item.finalPrice
        };
      });
    }
    
    // Prepare submission data - using the correct datetime format (YYYY-MM-DDThh:mm:ss)
    const [year, month, day] = showData.showDate.split('-').map(Number);
    const [hours, minutes] = showData.showTime.split(':').map(Number);
    const showTimeFormatted = `${showData.showDate}T${showData.showTime}:00`;
    
    const submissionData = {
      movieId: showData.movieId,
      theaterId: showData.theaterId,
      screenNumber: parseInt(showData.screenNumber),
      showTime: showTimeFormatted,
      language: showData.language,
      experience: showData.experience,
      cleanupTime: showData.cleanupTime,
      intervalTime: showData.intervalTime,
      pricing: formattedPricing
    };
    
    console.log("Submitting show data:", submissionData);
    
    dispatch(createShow(submissionData))
      .unwrap()
      .then(() => {
        toast.success('Show scheduled successfully');
        navigate('/manager/shows');
      })
      .catch(error => {
        // Enhanced error handling with detailed logging
        console.error("Error while creating show:", error);
        
        let errorMessage = 'Failed to schedule show';
        
        try {
          if (error && typeof error === 'object') {
            if (error.message) {
              errorMessage = error.message;
            } else if (error.data && error.data.message) {
              errorMessage = error.data.message;
            } else if (error.toString && typeof error.toString === 'function') {
              const errorString = error.toString();
              errorMessage = errorString !== '[object Object]' ? errorString : 'Server error occurred';
            } else {
              errorMessage = JSON.stringify(error);
            }
          } else if (typeof error === 'string') {
            errorMessage = error;
          }
        } catch (e) {
          console.error("Error while parsing error message:", e);
          errorMessage = "An unknown error occurred";
        }
        
        toast.error(errorMessage);
      });
  };
  

  return (
    <div className="container py-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-white p-4 border-bottom d-flex justify-content-between align-items-center">
          <h4 className="mb-0 text-primary">Schedule New Show</h4>
          <Button 
            variant="secondary" 
            className="d-flex align-items-center"
            onClick={() => navigate('/manager/shows')}
          >
            Back to Shows
          </Button>
        </Card.Header>
        <Card.Body className="p-4">
          {theaterLoading || moviesLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading data...</p>
            </div>
          ) : (
            <Form onSubmit={handleSubmit}>
              {/* Movie Search Section */}
              <Row className="mb-4">
                <Col lg={6} className="mb-3 mb-lg-0">
                  <Form.Group>
                    <Form.Label className="fw-bold d-flex align-items-center">
                      <Film size={18} className="me-2 text-primary" />
                      Movie
                      <span className="text-danger ms-1">*</span>
                    </Form.Label>
                    <div className="position-relative" ref={movieInputRef}>
                      <InputGroup>
                        <InputGroup.Text className="bg-white">
                          <Search size={16} />
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder="Search for a movie..."
                          value={movieSearchTerm}
                          onChange={handleMovieSearch}
                          onFocus={() => {
                            if (movieSearchTerm.trim() !== '') {
                              setShowMovieDropdown(true);
                            }
                          }}
                          autoComplete="off"
                        />
                      </InputGroup>
                      {showMovieDropdown && filteredMovies.length > 0 && (
                        <ListGroup className="position-absolute w-100 shadow-sm mt-1 z-3" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                          {filteredMovies.map(movie => (
                            <ListGroup.Item 
                              key={movie.id} 
                              action 
                              onClick={() => handleMovieSelect(movie)}
                              className="d-flex align-items-center py-2"
                            >
                              {movie.posterUrl && (
                                <img 
                                  src={movie.posterUrl} 
                                  alt={movie.title} 
                                  className="me-2 rounded" 
                                  style={{ width: '40px', height: '60px', objectFit: 'cover' }} 
                                />
                              )}
                              <div>
                                <div className="fw-bold">{movie.title}</div>
                                <small className="text-muted">
                                  {movie.duration} min • {movie.grade} • {movie.languages?.join(', ')}
                                </small>
                              </div>
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      )}
                    </div>
                    <small className="text-muted mt-1">
                      Search for released movies by title
                    </small>
                  </Form.Group>
                </Col>
                <Col lg={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold d-flex align-items-center">
                      <Monitor size={18} className="me-2 text-primary" />
                      Screen
                      <span className="text-danger ms-1">*</span>
                    </Form.Label>
                    <Form.Select 
                      name="screenNumber"
                      value={showData.screenNumber}
                      onChange={handleInputChange}
                      required
                      className="shadow-sm"
                    >
                      <option value="">Select Screen</option>
                      {screens?.[currentTheater?.id]?.map(screen => (
                        <option key={screen.screenNumber} value={screen.screenNumber}>
                          {screen.screenName || `Screen ${screen.screenNumber}`}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              {/* Date and Time Selection */}
              <Row className="mb-4">
                <Col lg={6} className="mb-3 mb-lg-0">
                  <Form.Group>
                    <Form.Label className="fw-bold d-flex align-items-center">
                      <Calendar size={18} className="me-2 text-primary" />
                      Show Date
                      <span className="text-danger ms-1">*</span>
                    </Form.Label>
                    <InputGroup className="shadow-sm">
                      <InputGroup.Text className="bg-white">
                        <Calendar size={16} />
                      </InputGroup.Text>
                      <Form.Control
                        type="date"
                        name="showDate"
                        value={showData.showDate}
                        onChange={handleInputChange}
                        min={formatDateForInput(new Date())}
                        required
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col lg={6}>
  <Form.Group>
    <Form.Label className="fw-bold d-flex align-items-center">
      <Clock size={18} className="me-2 text-primary" />
      Show Time
      <span className="text-danger ms-1">*</span>
    </Form.Label>
    <TimePicker 
      value={showData.showTime}
      onChange={(time) => {
        setShowData(prev => ({
          ...prev,
          showTime: time
        }));
      }}
      name="showTime"
    />
  </Form.Group>
</Col>
              </Row>

              {/* Schedule Timeline */}
              <Card className="mb-4 border-0 shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">
                    {scheduleTimeline.length > 0 
                      ? `Screen Schedule for ${showData.showDate}` 
                      : showData.screenNumber && showData.showDate
                        ? "No shows scheduled for this date and screen"
                        : "Select a screen and date to view schedule"}
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div className="timeline-container position-relative" style={{ height: '80px', background: '#f8f9fa' }}>
                    {/* Time markers */}
                    {[0, 6, 12, 18, 24].map((hour) => (
                      <div 
                        key={hour} 
                        className="time-marker position-absolute" 
                        style={{ left: `${(hour / 24) * 100}%`, top: '0px', bottom: '0px', borderLeft: '1px dashed #ccc' }}
                      >
                        <span className="badge bg-secondary position-absolute" style={{ top: '-20px', transform: 'translateX(-50%)' }}>
                          {hour}:00
                        </span>
                      </div>
                    ))}
                    
                    {/* Show blocks */}
                    {scheduleTimeline.map((item) => (
                      <div 
                        key={item.id}
                        className="show-block position-absolute rounded"
                        style={{
                          left: `${item.leftPosition}%`,
                          width: `${item.widthPercentage}%`,
                          top: '10px',
                          height: '60px',
                          backgroundColor: '#0d6efd',
                          color: 'white',
                          padding: '4px 8px',
                          fontSize: '12px',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center'
                        }}
                        title={`${item.title} (${item.startTime} - ${item.endTime})`}
                      >
                        <div style={{ 
                          fontWeight: 'bold', 
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {item.title}
                        </div>
                        <div>{item.startTime} - {item.endTime}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-center">
                    <small className="text-muted">24-hour timeline of scheduled shows for the selected screen</small>
                  </div>
                </Card.Body>
              </Card>

              {/* Error display for time conflicts */}
              {timeConflictError && (
                <Alert variant="danger" className="d-flex align-items-start mb-4">
                  <AlertTriangle size={24} className="me-2 flex-shrink-0 mt-1" />
                  <div>
                    <h6 className="alert-heading mb-2">Time Conflict Detected</h6>
                    <ul className="mb-0 ps-3">
                      {errorMessages.map((msg, index) => (
                        <li key={index}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                </Alert>
              )}

              {/* Language and Experience */}
              <Row className="mb-4">
                <Col lg={6} className="mb-3 mb-lg-0">
                  <Form.Group>
                    <Form.Label className="fw-bold d-flex align-items-center">
                      <Languages size={18} className="me-2 text-primary" />
                      Language
                      <span className="text-danger ms-1">*</span>
                    </Form.Label>
                    <Form.Select 
                      name="language"
                      value={showData.language}
                      onChange={handleInputChange}
                      required
                      className="shadow-sm"
                    >
                      <option value="">Select Language</option>
                      {movies
                        .find(m => m.id ===showData.movieId)
                        ?.languages?.map(lang => (
                          <option key={lang} value={lang}>{lang}</option>
                        ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col lg={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold d-flex align-items-center">
                      <Award size={18} className="me-2 text-primary" />
                      Experience
                      <span className="text-danger ms-1">*</span>
                    </Form.Label>
                    <Form.Select 
                      name="experience"
                      value={showData.experience}
                      onChange={handleInputChange}
                      required
                      className="shadow-sm"
                    >
                      <option value="">Select Experience</option>
                      {showData.experienceOptions.map(exp => (
                        <option key={exp} value={exp}>{exp}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              {/* Interval and Cleanup Times */}
              <Card className="mb-4 shadow-sm border-0">
                <Card.Header className="bg-light">
                  <h5 className="mb-0 fw-bold">Show Configuration</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6} className="mb-3 mb-md-0">
                      <Form.Group>
                        <Form.Label className="fw-bold">Interval Time (minutes)</Form.Label>
                        <InputGroup className="shadow-sm">
                          <Button 
                            variant="outline-secondary" 
                            onClick={() => handleNumberDecrement('intervalTime')}
                          >
                            -
                          </Button>
                          <Form.Control
                            type="number"
                            value={showData.intervalTime}
                            min={showData.intervalTimeMin}
                            max={showData.intervalTimeMax}
                            onChange={(e) => setShowData(prev => ({
                              ...prev, 
                              intervalTime: parseInt(e.target.value)
                            }))}
                            className="text-center"
                          />
                          <Button 
                            variant="outline-secondary" 
                            onClick={() => handleNumberIncrement('intervalTime')}
                          >
                            +
                          </Button>
                        </InputGroup>
                        <small className="text-muted">
                          Break time during the movie (affects showtimes)
                        </small>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-bold">Cleanup Time (minutes)</Form.Label>
                        <InputGroup className="shadow-sm">
                          <Button 
                            variant="outline-secondary" 
                            onClick={() => handleNumberDecrement('cleanupTime')}
                          >
                            -
                          </Button>
                          <Form.Control
                            type="number"
                            value={showData.cleanupTime}
                            min={showData.cleanupTimeMin}
                            max={showData.cleanupTimeMax}
                            onChange={(e) => setShowData(prev => ({
                              ...prev, 
                              cleanupTime: parseInt(e.target.value)
                            }))}
                            className="text-center"
                          />
                          <Button 
                            variant="outline-secondary" 
                            onClick={() => handleNumberIncrement('cleanupTime')}
                          >
                            +
                          </Button>
                        </InputGroup>
                        <small className="text-muted">
                          Time for theater cleanup after the show
                        </small>
                      </Form.Group>
                    </Col>
                  </Row>
                  {showData.movieId && movies?.find(m => m.id === showData.movieId) && (
                    <div className="mt-3">
                      <Alert variant="info" className="d-flex align-items-center mb-0">
                        <Info size={18} className="me-2" />
                        <div>
                          <strong>Total duration:</strong> {
                            movies.find(m => m.id === showData.movieId).duration + 
                            showData.intervalTime + 
                            showData.cleanupTime
                          } minutes 
                          <span className="ms-2 text-muted">
                            (Movie: {movies.find(m => m.id === showData.movieId).duration} min + 
                            Interval: {showData.intervalTime} min + 
                            Cleanup: {showData.cleanupTime} min)
                          </span>
                        </div>
                      </Alert>
                    </div>
                  )}
                </Card.Body>
              </Card>

              {/* Common Additional Charges Section */}
              <Card className="mb-4 shadow-sm border-0">
                <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-bold">Additional Charges</h5>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    onClick={addCommonCharge}
                    className="d-flex align-items-center"
                  >
                    <Plus size={16} className="me-1" /> Add Charge
                  </Button>
                </Card.Header>
                <Card.Body>
                  {showData.commonCharges.map((charge, index) => (
                    <Row key={index} className="mb-3 align-items-center">
                      <Col md={5}>
                        <Form.Control
                          type="text"
                          placeholder="Charge Type (e.g., CONVENIENCE_FEE, GST)"
                          value={charge.type}
                          onChange={(e) => updateCommonCharge(index, 'type', e.target.value)}
                          className="shadow-sm"
                        />
                      </Col>
                      <Col md={5}>
                        <InputGroup className="shadow-sm">
                          <Form.Control
                            type="number"
                            placeholder="Amount"
                            value={charge.amount}
                            onChange={(e) => updateCommonCharge(index, 'amount', e.target.value)}
                          />
                          <InputGroup.Text className="bg-white">
                            <Form.Check 
                              type="checkbox"
                              id={`percentage-check-${index}`}
                              label="%"
                              checked={charge.isPercentage}
                              onChange={(e) => updateCommonCharge(index, 'isPercentage', e.target.checked)}
                            />
                          </InputGroup.Text>
                        </InputGroup>
                      </Col>
                      <Col md={2} className="d-flex justify-content-end">
                        <Button 
                          variant="outline-danger" 
                          onClick={() => removeCommonCharge(index)}
                          className="d-flex align-items-center"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </Col>
                    </Row>
                  ))}
                  {showData.commonCharges.length === 0 && (
                    <div className="text-center py-3 text-muted">
                      No additional charges added
                    </div>
                  )}
                </Card.Body>
              </Card>

              {/* Pricing Section */}
              <Card className="mb-4 shadow-sm border-0">
                <Card.Header className="bg-light d-flex align-items-center">
                  <h5 className="mb-0 fw-bold">
                    <DollarSign size={18} className="me-2" />
                    Pricing Information
                  </h5>
                </Card.Header>
                <Card.Body>
                  {showData.screenSections.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Category Name</th>
                            <th>Base Price (₹)</th>
                            <th>Final Price (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {showData.screenSections.map(section => (
                            <tr key={section.categoryName}>
                              <td>
                                <span 
                                  className="d-inline-block rounded-circle me-2" 
                                  style={{ 
                                    backgroundColor: section.color || '#e9ecef', 
                                    width: '12px', 
                                    height: '12px' 
                                  }}
                                ></span>
                                {section.categoryName}
                              </td>
                              <td>
                                <Form.Control
                                  type="number"
                                  placeholder="Base Price"
                                  value={showData.pricing?.[section.categoryName]?.basePrice || ''}
                                  onChange={(e) => handlePriceChange(section.categoryName, e.target.value)}
                                  className="shadow-sm"
                                  min={0}
                                />
                              </td>
                              <td>
                                <InputGroup>
                                  <Form.Control
                                    type="number"
                                    placeholder="Final Price"
                                    value={showData.pricing?.[section.categoryName]?.finalPrice || ''}
                                    readOnly
                                    disabled
                                    className="bg-light"
                                  />
                                  <InputGroup.Text className="bg-light">
                                    <Info size={16} className="text-primary" />
                                  </InputGroup.Text>
                                </InputGroup>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-3 text-muted">
                      <p>No screen sections available. Please select a screen first.</p>
                    </div>
                  )}
                </Card.Body>
              </Card>

              {/* Submit Button */}
              <div className="d-grid gap-2 mt-4">
                <Button 
                  variant={timeConflictError ? "danger" : "primary"}
                  type="submit" 
                  disabled={showLoading || timeConflictError}
                  className="py-2"
                  size="lg"
                >
                  {timeConflictError ? (
                    <span>
                      <AlertTriangle size={20} className="me-2" />
                      Resolve Timing Conflicts
                    </span>
                  ) : showLoading ? (
                    <span>
                      <Spinner size="sm" animation="border" className="me-2" />
                      Scheduling Show...
                    </span>
                  ) : (
                    <span>Schedule Show</span>
                  )}
                </Button>
              </div>
            </Form>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default AddShow;