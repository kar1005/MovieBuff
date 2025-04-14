import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Button, Card, Row, Col, InputGroup, Spinner, Alert, Badge } from 'react-bootstrap';
import TimePicker from './TimePicker';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Film, 
  Clock, 
  Monitor, 
  Languages, 
  Award, 
  Info, 
  AlertTriangle,
  DollarSign 
} from 'lucide-react';
import { toast } from 'react-toastify';

import { 
  updateShow,
  getShowsByTheaterAndScreen
} from '../../../redux/slices/showSlice';
import { getAllMovies } from '../../../redux/slices/movieSlice';
import { fetchManagerTheaters, fetchTheaterScreens } from '../../../redux/slices/theaterSlice';
import axiosInstance from '../../../services/axiosConfig';

const EditShow = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // Extract params
  const { showId } = useParams();
  console.log("URL params:", useParams());
  console.log("Show ID from params:", showId);

  // Redux state
  const { currentTheater, screens, loading: theaterLoading } = useSelector(state => state.theater);
  const { movies, loading: moviesLoading } = useSelector(state => state.movies);
  const { showDetail, showsByScreen, isLoading: showLoading } = useSelector(state => state.shows);
  const { id: managerId } = useSelector(state => state.auth);

  // Error handling
  const [timeConflictError, setTimeConflictError] = useState(false);
  const [errorMessages, setErrorMessages] = useState([]);

  // Schedule Timeline
  const [scheduleTimeline, setScheduleTimeline] = useState([]);

  // Local state
  const [showData, setShowData] = useState({
    movieId: '',
    theaterId: '',
    screenNumber: '',
    showDate: '',
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
    cleanupTimeMax: 30,
    
    pricing: {},
    isFormReady: false
  });
  
  // Generate time slots in 15-minute increments
  // const timeSlots = [];
  // for (let hour = 9; hour <= 23; hour++) {
  //   for (let minute = 0; minute < 60; minute += 15) {
  //     const formattedHour = hour.toString().padStart(2, '0');
  //     const formattedMinute = minute.toString().padStart(2, '0');
  //     timeSlots.push(`${formattedHour}:${formattedMinute}`);
  //   }
  // }
  
  // Utility functions
  function formatDateForInput(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    let month = '' + (date.getMonth() + 1);
    let day = '' + date.getDate();
    const year = date.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }
  
  function getTimeFromDate(dateString) {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${hours}:${minutes}`;
    } catch (error) {
      console.error("Error formatting time:", error);
      return '';
    }
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
  
  function formatTimeDisplay(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Calculate final price based on base price and additional charges
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
      // Skip the current show being edited
      if (show.id === showId) return false;
      
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
      
      // Determine if this is the current show being edited
      const isCurrentShow = show.id === showId;
      
      return {
        id: show.id,
        title: show.movie?.title || 'Unknown Movie',
        startTime: formatTimeDisplay(startTime),
        endTime: formatTimeDisplay(endTime),
        leftPosition,
        widthPercentage,
        isCurrentShow
      };
    });
    
    return timelineItems;
  };

  // Input change handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShowData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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

  // Initial data loading
  useEffect(() => {
    console.log("Fetching initial data, showId param:", showId);
    
    // Fetch other required data first
    if (managerId) {
      dispatch(fetchManagerTheaters(managerId));
      dispatch(getAllMovies());
    }
    
    // Fetch the show details by ID
    if (showId) {
      // Direct API call instead of using redux action to avoid any potential issues
      axiosInstance.get(`/shows/${showId}`)
        .then(response => {
          console.log("Show details fetched directly:", response.data);
          
          // Manually update the redux store
          dispatch({
            type: 'shows/getShowByIdSuccess',
            payload: response.data
          });
          
          // Fetch movie details as well to ensure we have movie data
          if (response.data.movieId) {
            axiosInstance.get(`/movies/${response.data.movieId}`)
              .then(movieResponse => {
                console.log("Movie details fetched:", movieResponse.data);
                
                // Update movie in the store if needed
                const movieExists = movies.some(m => m.id === response.data.movieId);
                if (!movieExists) {
                  dispatch({
                    type: 'movies/getMovieByIdSuccess',
                    payload: movieResponse.data
                  });
                }
              })
              .catch(error => {
                console.error("Error fetching movie details:", error);
              });
          }
        })
        .catch(error => {
          console.error("Error fetching show:", error);
          toast.error("Failed to fetch show details");
        });
    }
  }, [dispatch, showId, managerId, movies]);

  // Load theater screens once theater is known
  useEffect(() => {
    if (currentTheater?.id) {
      console.log("Theater data loaded, fetching screens for theater:", currentTheater.id);
      dispatch(fetchTheaterScreens(currentTheater.id))
        .unwrap()
        .then(result => {
          console.log("Theater screens fetched successfully");
        })
        .catch(error => {
          console.error("Error fetching theater screens:", error);
        });
    }
  }, [dispatch, currentTheater]);

  // Populate form with show details once loaded
  useEffect(() => {
    if (showDetail && !showLoading) {
      console.log("Show detail loaded:", showDetail);
      
      // Find the movie name
      const movie = movies.find(m => m.id === showDetail.movieId);
      const movieName = movie ? movie.title : 'Unknown Movie';
      
      // Extract common charges from first pricing entry
      let commonCharges = [
        { type: 'CONVENIENCE_FEE', amount: 30, isPercentage: false },
        { type: 'GST', amount: 18, isPercentage: true }
      ];
      
      if (showDetail.pricing) {
        const firstCategory = Object.values(showDetail.pricing)[0];
        if (firstCategory && firstCategory.additionalCharges) {
          commonCharges = [...firstCategory.additionalCharges];
        }
      }
      
      // Format pricing data
      const pricing = {};
      if (showDetail.pricing) {
        Object.entries(showDetail.pricing).forEach(([key, value]) => {
          pricing[key] = {
            categoryName: key,
            basePrice: value.basePrice,
            finalPrice: value.finalPrice,
            additionalCharges: commonCharges
          };
        });
      }
      
      // Find the screen if we have the theater info
      let screenSections = [];
      let experienceOptions = [];
      
      if (currentTheater && screens?.[currentTheater.id]) {
        const selectedScreen = screens[currentTheater.id].find(
          s => s.screenNumber === showDetail.screenNumber
        );
        
        if (selectedScreen?.layout?.sections) {
          screenSections = selectedScreen.layout.sections;
        }
        
        // Find the matching experience options if we have movie data
        if (selectedScreen && movies.length > 0) {
          const movieDetails = movies.find(m => m.id === showDetail.movieId);
          if (movieDetails) {
            const screenExperiences = selectedScreen.supportedExperiences || [];
            const movieExperiences = movieDetails.experience || [];
            experienceOptions = movieExperiences.filter(
              exp => screenExperiences.includes(exp)
            );
          }
        }
      }
      
      setShowData({
        movieId: showDetail.movieId || '',
        movieName: movieName,
        theaterId: showDetail.theaterId || (currentTheater ? currentTheater.id : ''),
        screenNumber: showDetail.screenNumber?.toString() || '',
        showDate: formatDateForInput(showDetail.showTime),
        showTime: getTimeFromDate(showDetail.showTime),
        language: showDetail.language || '',
        experience: showDetail.experience || '',
        cleanupTime: showDetail.cleanupTime || 15,
        intervalTime: showDetail.intervalTime || 15,
        commonCharges,
        pricing,
        
        // Min/Max values
        intervalTimeMin: 0,
        intervalTimeMax: 30,
        cleanupTimeMin: 10,
        cleanupTimeMax: 30,
        
        experienceOptions,
        screenSections,
        isFormReady: true
      });
      
      console.log("Form data set successfully");
    }
  }, [showDetail, showLoading, currentTheater, screens, movies]);

  // Load screen sections and update form when screen is selected
  useEffect(() => {
    if (showData.theaterId && showData.screenNumber && screens?.[showData.theaterId]) {
      const selectedScreen = screens[showData.theaterId].find(
        s => s.screenNumber === parseInt(showData.screenNumber)
      );
      
      if (selectedScreen?.layout?.sections) {
        // Preserve existing pricing data
        const existingPricing = {...showData.pricing};
        const updatedPricing = {};
        
        // Update pricing for each section
        selectedScreen.layout.sections.forEach(section => {
          // Use existing pricing if available, otherwise create default
          if (existingPricing[section.categoryName]) {
            updatedPricing[section.categoryName] = existingPricing[section.categoryName];
          } else {
            const basePrice = section.basePrice || 100;
            const finalPrice = calculateFinalPrice(basePrice, showData.commonCharges);
            
            updatedPricing[section.categoryName] = {
              categoryName: section.categoryName,
              basePrice,
              finalPrice,
              additionalCharges: [...showData.commonCharges]
            };
          }
        });
        
        setShowData(prev => ({
          ...prev,
          screenSections: selectedScreen.layout.sections,
          pricing: updatedPricing
        }));
      }
    }
  }, [showData.screenNumber, showData.theaterId, screens, showData.commonCharges]);

  // Update experienceOptions when movie changes
  useEffect(() => {
    if (showData.movieId && showData.screenNumber && currentTheater?.id) {
      const selectedMovie = movies.find(m => m.id === showData.movieId);
      const selectedScreen = screens?.[currentTheater.id]?.find(
        s => s.screenNumber === parseInt(showData.screenNumber)
      );

      if (selectedMovie && selectedScreen) {
        // Get compatible experiences
        const movieExperiences = selectedMovie.experience || [];
        const screenExperiences = selectedScreen.supportedExperiences || [];
        const compatibleExperiences = movieExperiences.filter(
          exp => screenExperiences.includes(exp)
        );

        setShowData(prev => ({
          ...prev,
          experienceOptions: compatibleExperiences
        }));
      }
    }
  }, [showData.movieId, showData.screenNumber, currentTheater, movies, screens]);

  // Check for conflicting shows
// Updated code for fetching shows in EditShow component
// Screen and shows conflict checking - with proper date formatting
useEffect(() => {
  if (currentTheater?.id && showData.screenNumber && showData.showDate) {
    console.log("Checking for conflicting shows on date:", showData.showDate);
    
    try {
      // Format dates correctly for the backend (without time zone)
      // Format as 'YYYY-MM-DDT00:00:00' without timezone suffix
      const startOfDay = `${showData.showDate}T00:00:00`;
      const endOfDay = `${showData.showDate}T23:59:59`;
      
      console.log("Fetching shows for date range:", { startOfDay, endOfDay });
      
      // Only fetch other shows if we have a valid date and screen
      dispatch(getShowsByTheaterAndScreen({
        theaterId: currentTheater.id,
        screenNumber: parseInt(showData.screenNumber),
        startTime: startOfDay,
        endTime: endOfDay
      }))
      .unwrap()
      .then(() => {
        console.log("Successfully fetched shows for timeline display");
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
    } catch (error) {
      console.error("Error in show fetching logic:", error);
      toast.error("Failed to prepare schedule timeline request");
    }
  }
}, [dispatch, currentTheater, showData.screenNumber, showData.showDate]);

  // Generate schedule timeline when shows are loaded
  useEffect(() => {
    if (showsByScreen && showsByScreen.length > 0) {
      const timeline = generateScheduleTimeline();
      setScheduleTimeline(timeline);
    } else {
      setScheduleTimeline([]);
    }
  }, [showsByScreen]);

  // Check for time conflicts when relevant data changes
  useEffect(() => {
    if (showData.showTime && showData.showDate && showData.movieId) {
      checkTimeConflicts();
    }
  }, [showData.showTime, showData.showDate, showData.movieId, showData.intervalTime, showData.cleanupTime, showsByScreen]);

  // Update pricing when common charges change
  useEffect(() => {
    if (showData.pricing && Object.keys(showData.pricing).length > 0) {
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
// Updated form submission handler with enhanced error handling
const handleSubmit = (e) => {
  e.preventDefault();
  
  // Validate inputs
  if (!showData.showDate || !showData.showTime || 
      !showData.language || !showData.experience) {
    toast.error('Please fill in all required fields');
    return;
  }
  
  // Validate if we have pricing for all sections
  if (!showData.pricing || Object.keys(showData.pricing).length === 0) {
    toast.error('Pricing information is required');
    return;
  }
  
  // Check if screen sections have pricing
  const missingPricing = showData.screenSections.some(
    section => !showData.pricing[section.categoryName]
  );
  
  if (missingPricing) {
    toast.error('All seating categories must have pricing information');
    return;
  }
  
  // Check for time conflicts
  if (checkTimeConflicts()) {
    toast.error("Cannot update show: Time conflict with existing shows");
    return;
  }
  
  // Check if there are any changes
  const hasChanges = 
                     showDetail.language !== showData.language ||
                     showDetail.experience !== showData.experience ||
                     showDetail.cleanupTime !== showData.cleanupTime ||
                     showDetail.intervalTime !== showData.intervalTime ||
                     formatDateForInput(showDetail.showTime) !== showData.showDate ||
                     getTimeFromDate(showDetail.showTime) !== showData.showTime;
                     
  // Also check if pricing has changed
  const hasPricingChanges = Object.entries(showData.pricing).some(([key, value]) => {
    const originalPricing = showDetail.pricing?.[key];
    if (!originalPricing) return true;
    
    return originalPricing.basePrice !== value.basePrice || 
           originalPricing.finalPrice !== value.finalPrice;
  });
  
  if (!hasChanges && !hasPricingChanges) {
    toast.info('No changes detected');
    navigate('/manager/shows');
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
  
  // Prepare submission data with properly formatted date (YYYY-MM-DDThh:mm:ss)
  const showTimeFormatted = `${showData.showDate}T${showData.showTime}:00`;
  
  const submissionData = {
    id: showId,
    movieId: showData.movieId,
    theaterId: showData.theaterId,
    screenNumber: parseInt(showData.screenNumber),
    showTime: showTimeFormatted,
    language: showData.language,
    experience: showData.experience,
    cleanupTime: showData.cleanupTime,
    intervalTime: showData.intervalTime,
    pricing: formattedPricing,
    status: showDetail.status // Preserve existing status
  };
  
  console.log("Submitting updated show data:", submissionData);
  
  dispatch(updateShow({ id: showId, showData: submissionData }))
    .unwrap()
    .then(() => {
      toast.success('Show updated successfully');
      navigate('/manager/shows');
    })
    .catch(error => {
      // Enhanced error handling with better extraction and logging
      console.error("Error updating show:", error);
      
      let errorMessage = 'Failed to update show';
      
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
            try {
              errorMessage = JSON.stringify(error);
            } catch (e) {
              errorMessage = 'An unknown server error occurred';
            }
          }
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
      } catch (e) {
        console.error("Error while parsing error message:", e);
        errorMessage = "An unknown error occurred while processing the error message";
      }
      
      toast.error(errorMessage);
    });
};

  // Handle back button click
  const handleBack = () => {
    navigate('/manager/shows');
  };

  // Show loading state while data is being fetched
  if ((theaterLoading || moviesLoading || showLoading) && !showDetail) {
    return (
      <div className="container py-4">
        <Card className="shadow-sm">
          <Card.Header className="bg-white p-4 border-bottom">
            <h4 className="mb-0 text-primary">Edit Show</h4>
          </Card.Header>
          <Card.Body className="text-center p-5">
          <Spinner animation="border" variant="primary" />
            <p className="mt-3">Loading show details...</p>
          </Card.Body>
        </Card>
      </div>
    );
  }
  
  // Show error message if show details not found
  if (!showDetail && !showLoading) {
    return (
      <div className="container py-4">
        <Card className="shadow-sm">
          <Card.Header className="bg-white p-4 border-bottom d-flex justify-content-between align-items-center">
            <h4 className="mb-0 text-primary">Edit Show</h4>
            <Button variant="outline-secondary" onClick={handleBack} className="d-flex align-items-center">
              <ArrowLeft size={16} className="me-2" /> Back to Shows
            </Button>
          </Card.Header>
          <Card.Body className="text-center p-5">
            <AlertTriangle size={48} className="text-warning mb-3" />
            <h5 className="mb-3">Show details not found</h5>
            <p className="text-muted mb-4">The show you're trying to edit doesn't exist or has been deleted.</p>
            <Button variant="primary" onClick={handleBack} className="px-4">
              Return to Show List
            </Button>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-white p-4 border-bottom d-flex justify-content-between align-items-center">
          <h4 className="mb-0 text-primary">Edit Show</h4>
          <Button variant="outline-secondary" onClick={handleBack} className="d-flex align-items-center">
            <ArrowLeft size={16} className="me-2" /> Back to Shows
          </Button>
        </Card.Header>
        <Card.Body className="p-4">
          <Form onSubmit={handleSubmit}>
            {/* Movie and Screen Selection */}
            <Row className="mb-4">
              <Col lg={6} className="mb-3 mb-lg-0">
                <Form.Group>
                  <Form.Label className="fw-bold d-flex align-items-center">
                    <Film size={18} className="me-2 text-primary" />
                    Movie
                  </Form.Label>
                  <InputGroup className="shadow-sm">
                    <InputGroup.Text className="bg-light">
                      <Film size={16} />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      value={showData.movieName || ''}
                      disabled
                      className="bg-light"
                    />
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Movie cannot be changed for an existing show
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col lg={6}>
                <Form.Group>
                  <Form.Label className="fw-bold d-flex align-items-center">
                    <Monitor size={18} className="me-2 text-primary" />
                    Screen
                  </Form.Label>
                  <InputGroup className="shadow-sm">
                    <InputGroup.Text className="bg-light">
                      <Monitor size={16} />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      value={`Screen ${showData.screenNumber}`}
                      disabled
                      className="bg-light"
                    />
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Screen cannot be changed for an existing show
                  </Form.Text>
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
            {scheduleTimeline.length > 0 && (
              <Card className="mb-4 border-0 shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Screen Schedule for {showData.showDate}</h5>
                </Card.Header>
                <Card.Body>
                  <div className="timeline-container position-relative" style={{ height: '60px', background: '#f8f9fa' }}>
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
                        className={`show-block position-absolute rounded ${item.isCurrentShow ? 'border border-2 border-primary' : ''}`}
                        style={{
                          left: `${item.leftPosition}%`,
                          width: `${item.widthPercentage}%`,
                          top: '10px',
                          height: '40px',
                          backgroundColor: item.isCurrentShow ? '#0d6efd' : '#6c757d',
                          color: 'white',
                          padding: '2px 8px',
                          fontSize: '12px',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis'
                        }}
                        title={`${item.title} (${item.startTime} - ${item.endTime})${item.isCurrentShow ? ' - Current Show' : ''}`}
                      >
                        {item.startTime} - {item.endTime}
                        {item.isCurrentShow && <span className="ms-1">⭐</span>}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-center">
                    <small className="text-muted">24-hour timeline of scheduled shows for this screen</small>
                  </div>
                </Card.Body>
              </Card>
            )}

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
                    {/* Add some default language options in case the movie data isn't loaded yet */}
                    {!movies.find(m => m.id === showData.movieId)?.languages?.length && showData.language && (
                      <option value={showData.language}>{showData.language}</option>
                    )}
                    {movies
                      .find(m => m.id === showData.movieId)
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
                    {/* Add the current experience as an option if experienceOptions is empty */}
                    {(!showData.experienceOptions.length && showData.experience) && (
                      <option value={showData.experience}>{showData.experience}</option>
                    )}
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

            {/* Action Buttons */}
            <Row className="mt-4">
              <Col>
                <div className="d-grid gap-2 d-md-flex">
                  <Button 
                    variant="outline-secondary" 
                    type="button" 
                    onClick={handleBack}
                    className="w-100 me-md-2"
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant={timeConflictError ? "danger" : "primary"}
                    type="submit" 
                    disabled={showLoading || timeConflictError}
                    className="w-100"
                  >
                    {timeConflictError ? (
                      <span>
                        <AlertTriangle size={20} className="me-2" />
                        Resolve Timing Conflicts
                      </span>
                    ) : showLoading ? (
                      <span>
                        <Spinner size="sm" animation="border" className="me-2" />
                        Updating Show...
                      </span>
                    ) : (
                      <span>Update Show</span>
                    )}
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default EditShow;