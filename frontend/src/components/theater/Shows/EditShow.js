import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Button, Card, Row, Col, InputGroup, Spinner } from 'react-bootstrap';
import { Calendar, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';

import { 
  updateShow,
  getShowsByTheater
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
    const [year, month, day] = dateString.split('-');
    const [hours, minutes] = timeString.split(':');
    
    // Create local date with the correct hours and minutes
    const localDateTime = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes)
    );
    
    return localDateTime.toISOString();
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
  useEffect(() => {
    if (currentTheater?.id && showData.screenNumber && showData.showDate) {
      console.log("Checking for conflicting shows on date:", showData.showDate);
      
      const startDate = new Date(showData.showDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(showData.showDate);
      endDate.setHours(23, 59, 59, 999);
      
      // Only fetch other shows if we have a valid date and screen
      try {
        // Direct API call to avoid any issues with the redux action
        axiosInstance.get(`/shows/theater/${currentTheater.id}`)
          .then(response => {
            const shows = response.data;
            console.log("Got all theater shows, count:", shows.length);
            
            // Filter locally instead of using the API endpoint with problematic date params
            const filteredShows = shows.filter(show => {
              const showDate = new Date(show.showTime);
              return (
                show.screenNumber === parseInt(showData.screenNumber) &&
                showDate >= startDate && 
                showDate <= endDate
              );
            });
            
            console.log("Filtered shows for this screen and date:", filteredShows.length);
            
            // Update the shows in the state manually since we're not using the direct API
            dispatch({
              type: 'shows/filterByScreenAndDate',
              payload: filteredShows
            });
          })
          .catch(error => {
            console.error("Error fetching shows:", error);
            toast.error("Failed to fetch show schedule");
          });
      } catch (error) {
        console.error("Error in show fetching logic:", error);
      }
    }
  }, [dispatch, currentTheater, showData.screenNumber, showData.showDate]);

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
    
    // Prepare submission data
    const submissionData = {
      id: showId,
      movieId: showData.movieId,
      theaterId: showData.theaterId,
      screenNumber: parseInt(showData.screenNumber),
      showTime: createLocalDateTime(showData.showDate, showData.showTime),
      language: showData.language,
      experience: showData.experience,
      cleanupTime: showData.cleanupTime,
      intervalTime: showData.intervalTime,
      pricing: formattedPricing,
      status: showDetail.status // Preserve existing status
    };
    
    dispatch(updateShow({ id: showId, showData: submissionData }))
      .unwrap()
      .then(() => {
        toast.success('Show updated successfully');
        navigate('/manager/shows');
      })
      .catch(error => {
        toast.error(`Failed to update show: ${error}`);
      });
  };

  // Handle back button click
  const handleBack = () => {
    navigate('/manager/shows');
  };

  // Render methods
  const renderCommonCharges = () => (
    <Card className="mb-3">
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Additional Charges (Applied to all categories)</h5>
          <Button variant="outline-primary" size="sm" onClick={addCommonCharge}>
            <Plus size={16} /> Add Charge
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {showData.commonCharges.map((charge, index) => (
          <Row key={index} className="mb-2">
            <Col md={4}>
              <Form.Control
                type="text"
                placeholder="Charge Type (e.g., CONVENIENCE_FEE, GST)"
                value={charge.type}
                onChange={(e) => updateCommonCharge(index, 'type', e.target.value)}
              />
            </Col>
            <Col md={4}>
              <InputGroup>
                <Form.Control
                  type="number"
                  placeholder="Amount"
                  value={charge.amount}
                  onChange={(e) => updateCommonCharge(index, 'amount', e.target.value)}
                />
                <InputGroup.Text>
                  <Form.Check 
                    type="checkbox"
                    label="%"
                    checked={charge.isPercentage}
                    onChange={(e) => updateCommonCharge(index, 'isPercentage', e.target.checked)}
                  />
                </InputGroup.Text>
              </InputGroup>
            </Col>
            <Col md={4}>
              <Button variant="danger" onClick={() => removeCommonCharge(index)}>
                <Trash2 size={16} />
              </Button>
            </Col>
          </Row>
        ))}
      </Card.Body>
    </Card>
  );

  const renderPricingSection = () => (
    <Card className="mb-3">
      <Card.Header>Pricing Information</Card.Header>
      <Card.Body>
        {showData.screenSections.map(section => (
          <Row key={section.categoryName} className="mb-3">
            <Col md={4}>
              <Form.Label>{section.categoryName}</Form.Label>
            </Col>
            <Col md={4}>
              <Form.Control
                type="number"
                placeholder="Base Price"
                value={showData.pricing?.[section.categoryName]?.basePrice || ''}
                onChange={(e) => handlePriceChange(section.categoryName, e.target.value)}
              />
            </Col>
            <Col md={4}>
              <Form.Control
                type="number"
                placeholder="Final Price (calculated)"
                value={showData.pricing?.[section.categoryName]?.finalPrice || ''}
                readOnly
                disabled
              />
            </Col>
          </Row>
        ))}
      </Card.Body>
    </Card>
  );

  // Show loading state while data is being fetched
  if (showLoading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading show details...</p>
      </div>
    );
  }
  
  // Show error message if show details not found
  if (!showDetail && !showLoading) {
    return (
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h4>Edit Show</h4>
            <Button variant="outline-secondary" onClick={handleBack}>
              <ArrowLeft size={16} /> Back to Shows
            </Button>
          </div>
        </Card.Header>
        <Card.Body className="text-center">
          <div className="py-5">
            <h5>Show details not found</h5>
            <p className="text-muted">The show you're trying to edit doesn't exist or has been deleted.</p>
            <Button variant="primary" onClick={handleBack}>
              Return to Show List
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h4>Edit Show</h4>
          <Button variant="outline-secondary" onClick={handleBack}>
            <ArrowLeft size={16} /> Back to Shows
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          {/* Movie and Screen Selection */}
          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>Movie</Form.Label>
                <Form.Control
                  type="text"
                  value={showData.movieName || ''}
                  disabled
                  className="bg-light"
                />
                <Form.Text className="text-muted">
                  Movie cannot be changed for an existing show
                </Form.Text>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group>
                <Form.Label>Screen</Form.Label>
                <Form.Control
                  type="text"
                  value={`Screen ${showData.screenNumber}`}
                  disabled
                  className="bg-light"
                />
                <Form.Text className="text-muted">
                  Screen cannot be changed for an existing show
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          {/* Date and Time Selection */}
          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>Show Date</Form.Label>
                <InputGroup>
                  <InputGroup.Text><Calendar size={18} /></InputGroup.Text>
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
            <Col>
              <Form.Group>
                <Form.Label>Show Time</Form.Label>
                <Form.Select 
                  name="showTime"
                  value={showData.showTime}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Time</option>
                  {/* Add the current time as an option if it doesn't match predefined times */}
                  {!['09:00', '10:00', '12:00', '13:00', '15:00', '16:00', '18:00', '19:00', '21:00', '22:00'].includes(showData.showTime) && showData.showTime && (
                    <option value={showData.showTime}>{showData.showTime}</option>
                  )}
                  {[
                    '09:00', '10:00', '12:00', '13:00', 
                    '15:00', '16:00', '18:00', '19:00', 
                    '21:00', '22:00'
                  ].map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {/* Language and Experience */}
          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>Language</Form.Label>
                <Form.Select 
                  name="language"
                  value={showData.language}
                  onChange={handleInputChange}
                  required
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
            <Col>
              <Form.Group>
                <Form.Label>Experience</Form.Label>
                <Form.Select 
                  name="experience"
                  value={showData.experience}
                  onChange={handleInputChange}
                  required
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
          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>Interval Time (minutes)</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="number"
                    value={showData.intervalTime}
                    min={showData.intervalTimeMin}
                    max={showData.intervalTimeMax}
                    onChange={(e) => setShowData(prev => ({
                      ...prev, 
                      intervalTime: parseInt(e.target.value)
                    }))}
                  />
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => handleNumberDecrement('intervalTime')}
                  >
                    -
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => handleNumberIncrement('intervalTime')}
                  >
                    +
                  </Button>
                </InputGroup>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group>
                <Form.Label>Cleanup Time (minutes)</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="number"
                    value={showData.cleanupTime}
                    min={showData.cleanupTimeMin}
                    max={showData.cleanupTimeMax}
                    onChange={(e) => setShowData(prev => ({
                      ...prev, 
                      cleanupTime: parseInt(e.target.value)
                    }))}
                  />
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => handleNumberDecrement('cleanupTime')}
                  >
                    -
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => handleNumberIncrement('cleanupTime')}
                  >
                    +
                  </Button>
                </InputGroup>
              </Form.Group>
            </Col>
          </Row>

          {/* Unavailable Times Display */}
          {showsByScreen.length > 0 && (
            <Card className="mb-3">
              <Card.Header>Other Shows on This Day & Screen</Card.Header>
              <Card.Body>
                {showsByScreen
                  .filter(show => show.id !== showId) // Exclude current show
                  .map((show, index) => (
                    <div key={index} className="mb-2">
                      <strong>{show.movie?.title}</strong> - 
                      {new Date(show.showTime).toLocaleString()} to {' '}
                      {new Date(show.endTime).toLocaleString()}
                    </div>
                  ))}
                {showsByScreen.filter(show => show.id !== showId).length === 0 && (
                  <p className="text-muted">No other shows scheduled for this day and screen.</p>
                )}
              </Card.Body>
            </Card>
          )}

          {/* Common Additional Charges Section */}
          {renderCommonCharges()}

          {/* Pricing Section */}
          {renderPricingSection()}

          {/* Submit Button */}
          <div className="d-flex gap-2">
            <Button 
              variant="secondary" 
              type="button" 
              onClick={handleBack}
              className="w-50"
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              disabled={showLoading}
              className="w-50"
            >
              {showLoading ? 'Updating Show...' : 'Update Show'}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default EditShow;