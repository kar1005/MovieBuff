import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Building, MapPin, Phone, Mail, Settings, Navigation } from 'lucide-react';
import { toast } from 'react-toastify';
import { 
  selectCurrentTheater, 
  fetchManagerTheaters,
  updateTheaterAsync
} from '../../redux/slices/theaterSlice';

const TheaterEdit = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentTheater = useSelector(selectCurrentTheater);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validated, setValidated] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const initialState = {
    name: '',
    amenities: [],
    description: '',
    emailAddress: '',
    phoneNumber: '',
    status: 'ACTIVE',
    location: {
      address: '',
      city: '',
      state: '',
      zipCode: '',
      coordinates: [0, 0],
      googleLink: ''
    }
  };

  const [theater, setTheater] = useState(initialState);
  const [errors, setErrors] = useState({});

  const amenitiesList = [
    'Parking',
    'Food Court',
    'Wheelchair Access',
    'Dolby Sound',
    'IMAX',
    '4K Projection',
    'VIP Lounge',
    'Online Booking'
  ];

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      dispatch(fetchManagerTheaters(storedUserId));
    }
  }, [dispatch]);

  useEffect(() => {
    if (currentTheater) {
      setTheater(currentTheater);
    }
  }, [currentTheater]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!theater.name?.trim()) newErrors.name = 'Theater name is required';
    if (!theater.location?.address?.trim()) newErrors.address = 'Address is required';
    if (!theater.location?.city?.trim()) newErrors.city = 'City is required';
    if (!theater.location?.state?.trim()) newErrors.state = 'State is required';
    if (!theater.location?.zipCode?.trim()) newErrors.zipCode = 'ZIP code is required';

    if (theater.emailAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(theater.emailAddress)) {
      newErrors.emailAddress = 'Invalid email format';
    }

    if (theater.phoneNumber && !/^\+?[0-9]{10,12}$/.test(theater.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid phone number format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setValidated(true);
      return;
    }
  
    // Create TheaterRequest object according to the DTO format
    const theaterRequest = {
      name: theater.name,
      managerId: localStorage.getItem('userId'), // Get manager ID from localStorage
      amenities: theater.amenities || [],
      description: theater.description || '',
      emailAddress: theater.emailAddress || '',
      phoneNumber: theater.phoneNumber || '',
      totalScreens: theater.totalScreens || 0,
      location: {
        address: theater.location.address,
        city: theater.location.city,
        state: theater.location.state,
        zipCode: theater.location.zipCode,
        coordinates: theater.location.coordinates || [0, 0],
        googleLink: theater.location.googleLink || ''
      },
      // Keep existing screens data
      screens: theater.screens || []
    };
  
    setIsSubmitting(true);
    console.log("theaterRequest : ",JSON.stringify(theaterRequest.location));
    
    try {
      await dispatch(updateTheaterAsync({ 
        id: theater.id, 
        data: theaterRequest 
      })).unwrap();
      
      toast.success('Theater updated successfully!');
      navigate('/manager');
    } catch (error) {
      toast.error(error.message || 'Failed to update theater');
      setErrors(error.errors || {});
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocationChange = (field, value) => {
    setTheater(prev => ({
      ...prev,
      location: { 
        ...prev.location, 
        [field]: value 
      }
    }));
  };

  const handleAmenityToggle = (amenity) => {
    setTheater(prev => ({
      ...prev,
      amenities: prev.amenities?.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...(prev.amenities || []), amenity]
    }));
  };

  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          handleLocationChange('coordinates', [latitude, longitude]);
          
          // Generate Google Maps link
          const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
          handleLocationChange('googleLink', mapsLink.toString());
          console.log("mapsLink : ", mapsLink );
          setIsLoadingLocation(false);
          toast.success('Location updated successfully!');
        },
        (error) => {
          setIsLoadingLocation(false);
          toast.error('Failed to get location: ' + error.message);
        }
      );
    } else {
      setIsLoadingLocation(false);
      toast.error('Geolocation is not supported by your browser');
    }
  };

  if (!currentTheater) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Edit Theater - {theater.name}</h5>
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate('/manager')}
            disabled={isSubmitting}
          >
            Back
          </Button>
        </Card.Header>

        <Card.Body>
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Theater Name*</Form.Label>
                  <Form.Control
                    type="text"
                    value={theater.name}
                    onChange={(e) => setTheater({...theater, name: e.target.value})}
                    isInvalid={!!errors.name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={theater.status}
                    onChange={(e) => setTheater({...theater, status: e.target.value})}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={theater.description}
                onChange={(e) => setTheater({...theater, description: e.target.value})}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    value={theater.emailAddress}
                    onChange={(e) => setTheater({...theater, emailAddress: e.target.value})}
                    isInvalid={!!errors.emailAddress}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.emailAddress}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    value={theater.phoneNumber}
                    onChange={(e) => setTheater({...theater, phoneNumber: e.target.value})}
                    isInvalid={!!errors.phoneNumber}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.phoneNumber}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Card className="mb-3">
              <Card.Header>
                <h6 className="mb-0">Location Details</h6>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Address*</Form.Label>
                  <Form.Control
                    type="text"
                    value={theater.location?.address}
                    onChange={(e) => handleLocationChange('address', e.target.value)}
                    isInvalid={!!errors.address}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.address}
                  </Form.Control.Feedback>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>City*</Form.Label>
                      <Form.Control
                        type="text"
                        value={theater.location?.city}
                        onChange={(e) => handleLocationChange('city', e.target.value)}
                        isInvalid={!!errors.city}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.city}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>State*</Form.Label>
                      <Form.Control
                        type="text"
                        value={theater.location?.state}
                        onChange={(e) => handleLocationChange('state', e.target.value)}
                        isInvalid={!!errors.state}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.state}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>ZIP Code*</Form.Label>
                      <Form.Control
                        type="text"
                        value={theater.location?.zipCode}
                        onChange={(e) => handleLocationChange('zipCode', e.target.value)}
                        isInvalid={!!errors.zipCode}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.zipCode}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex gap-2 align-items-center">
                  <Button 
                    variant="outline-primary"
                    onClick={getCurrentLocation}
                    disabled={isLoadingLocation}
                  >
                    {isLoadingLocation ? (
                      <Spinner size="sm" />
                    ) : (
                      <>
                        <Navigation size={18} className="me-2" />
                        Get Current Location
                      </>
                    )}
                  </Button>
                  {theater.location?.coordinates?.[0] !== 0 && (
                    <span className="text-muted">
                      Lat: {theater.location.coordinates[0]}, 
                      Long: {theater.location.coordinates[1]}
                    </span>
                  )}
                </div>
              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Header>
                <h6 className="mb-0">Amenities</h6>
              </Card.Header>
              <Card.Body>
                <div className="d-flex flex-wrap gap-2">
                  {amenitiesList.map(amenity => (
                    <Button
                      key={amenity}
                      variant={theater.amenities?.includes(amenity) ? 'primary' : 'outline-primary'}
                      onClick={() => handleAmenityToggle(amenity)}
                      className="d-flex align-items-center gap-2"
                    >
                      <Settings size={16} />
                      {amenity}
                    </Button>
                  ))}
                </div>
              </Card.Body>
            </Card>

            <div className="d-flex gap-2">
              <Button 
                variant="primary" 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate('/manager')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TheaterEdit;