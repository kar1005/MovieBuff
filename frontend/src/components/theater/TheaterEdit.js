import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Row, Col, Alert, Tab, Nav, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Building, MapPin, Phone, Mail, Settings, Monitor } from 'lucide-react';
import { toast } from 'react-toastify';

const TheaterEdit = () => {
  const { theaterId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [validated, setValidated] = useState(false);

  const initialState = {
    name: '',
    amenities: [],
    description: '',
    emailAddress: '',
    phoneNumber: '',
    totalScreens: 0,
    location: {
      address: '',
      city: '',
      state: '',
      zipCode: '',
      coordinates: [0, 0]
    },
    screens: []
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

  const screenExperiences = [
    '2D', '3D', 'IMAX', '4DX', 'Dolby Atmos'
  ];

  useEffect(() => {
    const fetchTheater = async () => {
      try {
        console.log('Fetching theater with ID:', theaterId);
        const response = await axios.get(`http://localhost:8080/api/theaters/${theaterId}`);
        console.log('Fetched theater data:', response.data);
        
        const data = {
          ...response.data,
          totalScreens: response.data.totalScreens || response.data.screens?.length || 0
        };
        
        setTheater(data);
      } catch (error) {
        console.error('Error fetching theater:', error);
        toast.error(error.response?.data?.message || 'Failed to load theater data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTheater();
  }, [theaterId]);

  const validateForm = () => {
    const newErrors = {};
    
    // Required fields validation
    if (!theater.name?.trim()) newErrors.name = 'Theater name is required';
    if (!theater.totalScreens || theater.totalScreens < 0) {
      newErrors.totalScreens = 'Must have at least one screen';
    }

    // Location validation
    if (!theater.location?.address?.trim()) newErrors.address = 'Address is required';
    if (!theater.location?.city?.trim()) newErrors.city = 'City is required';
    if (!theater.location?.state?.trim()) newErrors.state = 'State is required';
    if (!theater.location?.zipCode?.trim()) newErrors.zipCode = 'ZIP code is required';

    // Email validation
    if (theater.emailAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(theater.emailAddress)) {
      newErrors.emailAddress = 'Invalid email format';
    }

    // Phone validation
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
      const firstError = Object.keys(errors)[0];
      if (firstError) {
        // Find tab containing error and switch to it
        setActiveTab(getTabForField(firstError));
      }
      return;
    }

    const theaterDTO = {
      name: theater.name,
      amenities: theater.amenities || [],
      description: theater.description,
      emailAddress: theater.emailAddress,
      phoneNumber: theater.phoneNumber,
      totalScreens: parseInt(theater.totalScreens),
      location: {
        ...theater.location,
        coordinates: theater.location.coordinates || [0, 0]
      },
      screens: theater.screens || []
    };

    console.log('Submitting theater update:', theaterDTO);
    setIsSubmitting(true);

    try {
      const response = await axios.put(`http://localhost:8080/api/theaters/${theaterId}`, theaterDTO);
      console.log('Update response:', response.data);
      toast.success('Theater updated successfully!');
      
      setTimeout(() => navigate('/manager/theaters'), 1500);
    } catch (error) {
      console.error('Update error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update theater';
      toast.error(errorMessage);
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTabForField = (fieldName) => {
    const tabMapping = {
      name: 'basic',
      totalScreens: 'basic',
      emailAddress: 'basic',
      phoneNumber: 'basic',
      address: 'location',
      city: 'location',
      state: 'location',
      zipCode: 'location',
    };
    return tabMapping[fieldName] || 'basic';
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

  const handleScreenChange = (index, field, value) => {
    setTheater(prev => {
      const updatedScreens = [...(prev.screens || [])];
      if (!updatedScreens[index]) {
        updatedScreens[index] = {};
      }
      updatedScreens[index] = {
        ...updatedScreens[index],
        [field]: value
      };
      return { ...prev, screens: updatedScreens };
    });
  };

  const handleScreenExperienceToggle = (index, experience) => {
    setTheater(prev => {
      const updatedScreens = [...(prev.screens || [])];
      if (!updatedScreens[index]) {
        updatedScreens[index] = { supportedExperiences: [] };
      }
      
      const currentExperiences = updatedScreens[index].supportedExperiences || [];
      updatedScreens[index] = {
        ...updatedScreens[index],
        supportedExperiences: currentExperiences.includes(experience)
          ? currentExperiences.filter(exp => exp !== experience)
          : [...currentExperiences, experience]
      };
      
      return { ...prev, screens: updatedScreens };
    });
  };

  if (isLoading) {
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
            onClick={() => navigate('/manager/theaters')}
            disabled={isSubmitting}
          >
            Back
          </Button>
        </Card.Header>

        <Card.Body>
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
              <Row>
                <Col md={3}>
                  <Nav variant="pills" className="flex-column">
                    <Nav.Item>
                      <Nav.Link eventKey="basic" className="d-flex align-items-center gap-2">
                        <Building size={18} />
                        Basic Details
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="location" className="d-flex align-items-center gap-2">
                        <MapPin size={18} />
                        Location
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="screens" className="d-flex align-items-center gap-2">
                        <Monitor size={18} />
                        Screens
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="amenities" className="d-flex align-items-center gap-2">
                        <Settings size={18} />
                        Amenities
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>
                </Col>

                <Col md={9}>
                  <Tab.Content>
                    <Tab.Pane eventKey="basic">
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
                            <Form.Label>Total Screens*</Form.Label>
                            <Form.Control
                              type="number"
                              value={theater.totalScreens}
                              onChange={(e) => setTheater({...theater, totalScreens: e.target.value})}
                              min="0"
                              isInvalid={!!errors.totalScreens}
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.totalScreens}
                            </Form.Control.Feedback>
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
                    </Tab.Pane>

                    <Tab.Pane eventKey="location">
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
                    </Tab.Pane>

                    <Tab.Pane eventKey="screens">
                      {[...Array(parseInt(theater.totalScreens || 0))].map((_, index) => (
                        <Card key={index} className="mb-3">
                          <Card.Header>
                            <h6 className="mb-0">Screen {index + 1}</h6>
                          </Card.Header>
                          <Card.Body>
                            <Row className="mb-3">
                              <Col md={6}>
                                <Form.Group>




                                <Form.Label>Screen Name</Form.Label>
                                  <Form.Control
                                    type="text"
                                    value={theater.screens?.[index]?.screenName || ''}
                                    onChange={(e) => handleScreenChange(index, 'screenName', e.target.value)}
                                    placeholder="e.g., IMAX Screen 1"
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group>
                                  <Form.Label>Screen Number</Form.Label>
                                  <Form.Control
                                    type="number"
                                    value={theater.screens?.[index]?.screenNumber || index + 1}
                                    onChange={(e) => handleScreenChange(index, 'screenNumber', parseInt(e.target.value))}
                                    min="1"
                                  />
                                </Form.Group>
                              </Col>
                            </Row>

                            <Form.Group className="mb-3">
                              <Form.Label>Supported Experiences</Form.Label>
                              <div className="d-flex flex-wrap gap-2">
                                {screenExperiences.map((exp) => (
                                  <Button
                                    key={exp}
                                    variant={
                                      theater.screens?.[index]?.supportedExperiences?.includes(exp)
                                        ? 'primary'
                                        : 'outline-primary'
                                    }
                                    size="sm"
                                    onClick={() => handleScreenExperienceToggle(index, exp)}
                                  >
                                    {exp}
                                  </Button>
                                ))}
                              </div>
                            </Form.Group>

                            <Row>
                              <Col md={6}>
                                <Form.Group>
                                  <Form.Label>Projector Type</Form.Label>
                                  <Form.Control
                                    type="text"
                                    value={theater.screens?.[index]?.screenFeatures?.projectorType || ''}
                                    onChange={(e) => handleScreenChange(index, 'screenFeatures', {
                                      ...theater.screens?.[index]?.screenFeatures,
                                      projectorType: e.target.value
                                    })}
                                    placeholder="e.g., 4K Digital"
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group>
                                  <Form.Label>Sound System</Form.Label>
                                  <Form.Control
                                    type="text"
                                    value={theater.screens?.[index]?.screenFeatures?.soundSystem || ''}
                                    onChange={(e) => handleScreenChange(index, 'screenFeatures', {
                                      ...theater.screens?.[index]?.screenFeatures,
                                      soundSystem: e.target.value
                                    })}
                                    placeholder="e.g., Dolby Atmos"
                                  />
                                </Form.Group>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      ))}
                    </Tab.Pane>

                    <Tab.Pane eventKey="amenities">
                      <div className="d-flex flex-wrap gap-3">
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
                    </Tab.Pane>
                  </Tab.Content>
                </Col>
              </Row>
            </Tab.Container>

            <div className="d-flex gap-2 mt-4">
              <Button 
                variant="primary" 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate('/manager/theaters')}
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