import React, { useState, useCallback } from 'react';
import { Container, Navbar, Nav, Form, Button, Modal, Spinner, Toast } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import Logo from "./../../images/Logo/Logo.png";
import { toast } from 'react-toastify';
import './Header.css';

function Header() {
  const [showModal, setShowModal] = useState(false);
  const [userCity, setUserCity] = useState('Select City');
  const [cityInput, setCityInput] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [locationData, setLocationData] = useState({
    coordinates: null,
    googleLink: '',
    city: ''
  });
  const [popularCities, setPopularCities] = useState([
    'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata', 
    'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'
  ]);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [showAllCities, setShowAllCities] = useState(false);
  const [allCities, setAllCities] = useState([]);
  
  const location = useLocation();
  
  const handleShow = () => setShowModal(true);
  const handleClose = () => {
    setShowModal(false);
    setShowAllCities(false);
    setCitySuggestions([]);
    setCityInput('');
  };
  
  const handleCitySelection = (city) => {
    setUserCity(city);
    handleClose();
  };
  
  const handleManualCitySelection = () => {
    if (cityInput.trim()) {
      setUserCity(cityInput);
      handleClose();
    }
  };

  const handleLocationChange = (field, value) => {
    setLocationData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const detectUserLocation = () => {
    setIsLoadingLocation(true);
    setLocationError('');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          handleLocationChange('coordinates', [latitude, longitude]);
          
          // Generate Google Maps link
          const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
          handleLocationChange('googleLink', mapsLink.toString());
          
          // Fetch city name using coordinates
          fetchCityFromCoords(latitude, longitude);
        },
        (error) => {
          setIsLoadingLocation(false);
          setLocationError('Location permission denied. Please select your city manually.');
          toast.error('Failed to get location: ' + error.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsLoadingLocation(false);
      setLocationError('Geolocation is not supported by your browser. Please select your city manually.');
      toast.error('Geolocation is not supported by your browser');
    }
  };
  
  const fetchCityFromCoords = async (latitude, longitude) => {
    const geocodingServices = [
      // OpenStreetMap Nominatim
      async () => {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await response.json();
        return data.address.city || data.address.town || 'Unknown';
      },
      // Google Maps Geocoding API (requires API key)
      async () => {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=YOUR_GOOGLE_API_KEY`
        );
        const data = await response.json();
        const cityComponent = data.results[0].address_components.find(
          component => component.types.includes('locality')
        );
        return cityComponent ? cityComponent.long_name : 'Unknown';
      },
      // Here Maps Geocoding API (alternative option)
      async () => {
        const response = await fetch(
          `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${latitude},${longitude}&apiKey=YOUR_HERE_API_KEY`
        );
        const data = await response.json();
        return data.items[0].address.city || 'Unknown';
      }
    ];
  
    for (const service of geocodingServices) {
      try {
        const city = await service();
        if (city !== 'Unknown') {
          handleLocationChange('city', city);
          setUserCity(city);
          return;
        }
      } catch (error) {
        console.error('Geocoding service failed:', error);
      }
    }
  
    // Fallback if all services fail
    setLocationError('Could not determine your precise location');
  };

  // Debounce function for API calls
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  // Function to fetch city suggestions as user types
  const fetchCitySuggestions = useCallback(
    debounce(async (input) => {
      if (!input.trim() || input.length < 2) {
        setCitySuggestions([]);
        return;
      }

      setIsLoadingCities(true);
      try {
        const response = await fetch('https://countriessnow.space/api/v0.1/countries/cities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ country: 'India' }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch cities');
        }

        const data = await response.json();
        if (!data.error && Array.isArray(data.data)) {
          // Filter cities that include the input (case insensitive)
          const filteredCities = data.data.filter(city => 
            city.toLowerCase().includes(input.toLowerCase())
          ).slice(0, 5); // Limit to 5 suggestions
          
          setCitySuggestions(filteredCities);
          
          // Store all cities for "Show All" feature
          setAllCities(data.data);
        }
      } catch (error) {
        console.error('Error fetching city suggestions:', error);
        // toast.error('Failed to load city suggestions');
      } finally {
        setIsLoadingCities(false);
      }
    }, 300),
    []
  );

  // Handle input change and fetch suggestions
  const handleCityInputChange = (e) => {
    const value = e.target.value;
    setCityInput(value);
    fetchCitySuggestions(value);
  };

  // Function to toggle showing all cities
  const handleShowAllCities = async () => {
    setShowAllCities(true);
    
    // If we don't already have all cities, fetch them
    if (allCities.length === 0) {
      setIsLoadingCities(true);
      try {
        const response = await fetch('https://countriesnow.space/api/v0.1/countries/cities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ country: 'India' }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch cities');
        }

        const data = await response.json();
        if (!data.error && Array.isArray(data.data)) {
          setAllCities(data.data);
        }
      } catch (error) {
        console.error('Error fetching all cities:', error);
        toast.error('Failed to load cities');
      } finally {
        setIsLoadingCities(false);
      }
    }
  };

  // Function to chunk an array into smaller arrays of specified size
  const chunkArray = (array, size) => {
    const chunkedArr = [];
    for (let i = 0; i < array.length; i += size) {
      chunkedArr.push(array.slice(i, i + size));
    }
    return chunkedArr;
  };
  
  return (
    <div>
      <Navbar bg="dark" variant="dark" expand="lg" sticky="top" className="navbar">
        <Container>
          <div className="d-flex align-items-center">
            <img src={Logo} className="navbar-logo me-2" alt="MovieBuff Logo" />
            <Navbar.Brand href="/">MovieBuff</Navbar.Brand>
          </div>
          
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            {/* Main navigation on the left */}
            <Nav className="main-links">
              <Nav.Link as={Link} to="/" className={location.pathname === "/" ? "active" : ""}>
                Home
              </Nav.Link>
              <Nav.Link as={Link} to="/book" className={location.pathname === "/book" ? "active" : ""}>
                Book
              </Nav.Link>
              <Form className="d-flex search-bar-container mx-lg-4">
                <div className="position-relative w-100">
                  <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                  <Form.Control 
                    type="text" 
                    placeholder="Search for Movies, Events and more" 
                    className="search-input"
                  />
                </div>
                <Button 
                  variant="outline-light" 
                  onClick={handleShow} 
                  className="location-button d-flex align-items-center"
                  size="sm"
                >
                  <i className="bi bi-geo-alt-fill me-1"></i>
                  {userCity}
                </Button>
              </Form>
            </Nav>
            
            {/* Auth links on the right */}
            <div className="auth-container">
              <Nav.Link as={Link} to="/login" className={`auth-link login-link ${location.pathname === "/login" ? "active" : ""}`}>
                Login
              </Nav.Link>
              <Nav.Link as={Link} to="/register" className={`auth-link register-link ${location.pathname === "/register" ? "active" : ""}`}>
                Register
              </Nav.Link>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      
      {/* Location Modal */}
      <Modal 
        show={showModal} 
        onHide={handleClose} 
        centered
        size={showAllCities ? "lg" : "md"}
        className="city-selection-modal"
      >
        <Modal.Header closeButton className="location-modal-header">
          <Modal.Title>{showAllCities ? "All Cities" : "Select Your City"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!showAllCities ? (
            <>
              <Button 
                variant="outline-primary" 
                onClick={detectUserLocation} 
                className="detect-location-btn mb-3 w-100"
                disabled={isLoadingLocation}
              >
                {isLoadingLocation ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Detecting your location...
                  </>
                ) : (
                  <>
                    <i className="bi bi-crosshair me-2"></i>
                    Detect my current location
                  </>
                )}
              </Button>
              
              {locationError && (
                <div className="alert alert-warning">{locationError}</div>
              )}
              
              {locationData.googleLink && (
                <div className="location-preview mb-3">
                  <small className="text-muted d-block mb-1">Your detected location:</small>
                  <a 
                    href={locationData.googleLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="d-flex align-items-center text-primary"
                  >
                    <i className="bi bi-map me-1"></i>
                    {locationData.city || 'View on map'}
                  </a>
                </div>
              )}
              
              <div className="city-search-wrapper mb-3 position-relative">
                <Form.Group className="position-relative">
                  <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                  <Form.Control 
                    type="text" 
                    placeholder="Search for your city" 
                    className="city-search-input ps-5"
                    value={cityInput}
                    onChange={handleCityInputChange}
                    autoComplete="off"
                  />
                  {isLoadingCities && (
                    <Spinner 
                      animation="border" 
                      size="sm" 
                      className="position-absolute top-50 end-0 translate-middle-y me-3"
                    />
                  )}
                </Form.Group>
                
                {/* City suggestions dropdown */}
                {citySuggestions.length > 0 && (
                  <div className="city-suggestions">
                    {citySuggestions.map((city, index) => (
                      <div 
                        key={index} 
                        className="city-suggestion-item" 
                        onClick={() => handleCitySelection(city)}
                      >
                        <i className="bi bi-geo-alt me-2 text-muted"></i>
                        {city}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="popular-cities-heading mb-0">Popular Cities</h6>
                <Button 
                  variant="link" 
                  className="show-all-cities-btn p-0"
                  onClick={handleShowAllCities}
                  disabled={isLoadingCities}
                >
                  Show All Cities
                </Button>
              </div>
              
              <div className="popular-cities-grid">
                {popularCities.map((city, index) => (
                  <Button 
                    key={index} 
                    variant="light" 
                    className="city-button" 
                    onClick={() => handleCitySelection(city)}
                  >
                    {city}
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <>
              {isLoadingCities ? (
                <div className="text-center p-4">
                  <Spinner animation="border" />
                  <p className="mt-2">Loading cities...</p>
                </div>
              ) : (
                <div className="all-cities-container">
                  <div className="mb-3">
                    <Form.Control
                      type="text"
                      placeholder="Filter cities..."
                      value={cityInput}
                      onChange={handleCityInputChange}
                      className="city-filter-input"
                    />
                  </div>
                  
                  <div className="all-cities-grid">
                    {(cityInput.trim() ? citySuggestions : allCities).map((city, index) => (
                      <Button
                        key={index}
                        variant="light"
                        className="city-button"
                        onClick={() => handleCitySelection(city)}
                      >
                        {city}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          {showAllCities ? (
            <Button variant="secondary" onClick={() => setShowAllCities(false)}>
              Back
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleManualCitySelection}
                disabled={!cityInput.trim()}
              >
                Select
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Header;