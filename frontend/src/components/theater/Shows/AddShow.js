import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Card, Row, Col, InputGroup } from 'react-bootstrap';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

import { createShow, getShowsByTheaterAndScreen } from '../../../redux/slices/showSlice';
import { getAllMovies } from '../../../redux/slices/movieSlice';
import { fetchManagerTheaters, fetchTheaterScreens } from '../../../redux/slices/theaterSlice';

const AddShow = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

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

  // FIXED FUNCTION: Creates a proper ISO string without timezone adjustments
  function createLocalDateTime(dateString, timeString) {
    // This creates a string in ISO format but without timezone adjustment
    return `${dateString}T${timeString}:00.000Z`;
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

  // Data loading effects
  useEffect(() => {
    if (managerId) {
      dispatch(fetchManagerTheaters(managerId));
      dispatch(getAllMovies({ status: 'NOW_SHOWING' }));
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

  // Screen and shows conflict checking
  useEffect(() => {
    if (currentTheater?.id && showData.screenNumber && showData.showDate) {
      const startOfDay = new Date(showData.showDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(showData.showDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      dispatch(getShowsByTheaterAndScreen({
        theaterId: currentTheater.id,
        screenNumber: parseInt(showData.screenNumber),
        startTime: startOfDay.toISOString(),
        endTime: endOfDay.toISOString()
      }));
    }
  }, [dispatch, currentTheater, showData.screenNumber, showData.showDate]);

  // Movie and experience selection effects
  useEffect(() => {
    if (showData.movieId && currentTheater?.id && showData.screenNumber) {
      const selectedMovie = movies.find(m => m.id === showData.movieId);
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
      movieId: showData.movieId,
      theaterId: showData.theaterId,
      screenNumber: parseInt(showData.screenNumber),
      showTime: createLocalDateTime(showData.showDate, showData.showTime),
      language: showData.language,
      experience: showData.experience,
      cleanupTime: showData.cleanupTime,
      intervalTime: showData.intervalTime,
      pricing: formattedPricing
    };
    
    console.log("Submitting show data:", submissionData); // For debugging
    
    dispatch(createShow(submissionData))
      .unwrap()
      .then(() => {
        toast.success('Show scheduled successfully');
        navigate('/manager/shows');
      })
      .catch(error => {
        toast.error(`Failed to schedule show: ${error}`);
      });
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

  return (
    <Card>
      <Card.Header>
        <h4>Schedule New Show</h4>
      </Card.Header>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          {/* Movie and Screen Selection */}
          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>Select Movie</Form.Label>
                <Form.Select 
                  name="movieId"
                  value={showData.movieId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Movie</option>
                  {movies.map(movie => (
                    <option key={movie.id} value={movie.id}>
                      {movie.title} ({movie.duration} min)
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group>
                <Form.Label>Select Screen</Form.Label>
                <Form.Select 
                  name="screenNumber"
                  value={showData.screenNumber}
                  onChange={handleInputChange}
                  required
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
              <Card.Header>Conflicting Shows</Card.Header>
              <Card.Body>
                {showsByScreen.map((show, index) => (
                  <div key={index} className="mb-2">
                    <strong>{show.movie?.title}</strong> - 
                    {new Date(show.showTime).toLocaleString()} to {' '}
                    {new Date(show.endTime).toLocaleString()}
                  </div>
                ))}
              </Card.Body>
            </Card>
          )}

          {/* Common Additional Charges Section */}
          {renderCommonCharges()}

          {/* Pricing Section */}
          {renderPricingSection()}

          {/* Submit Button */}
          <Button 
            variant="primary" 
            type="submit" 
            disabled={showLoading}
            className="w-100"
          >
            {showLoading ? 'Scheduling Show...' : 'Schedule Show'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default AddShow;