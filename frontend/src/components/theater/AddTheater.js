import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { createTheater } from '../../redux/slices/theaterSlice';

const AddTheater = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  // Get managerId from URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const managerId = queryParams.get('managerId');
  
  const [validated, setValidated] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    managerId: managerId, // Initialize with managerId from URL
    description: '',
    emailAddress: '',
    phoneNumber: '',
    amenities: [],
    location: {
      coordinates: [0, 0],
      address: '',
      city: '',
      state: '',
      zipCode: ''
    },
    status: 'ACTIVE',
    totalScreens: 0  // Initialize totalScreens to 0
  });

  // Redirect if no managerId is provided
  useEffect(() => {
    if (!managerId) {
      setError('Manager ID is required');
      setTimeout(() => {
        navigate('/manager/theaters');
      }, 2000);
    }
  }, [managerId, navigate]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAmenityToggle = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    // Ensure managerId and totalScreens are included in the submission
    const theaterData = {
      ...formData,
      managerId: managerId, // Explicitly set managerId
      totalScreens: 0 // Explicitly set totalScreens
    };

    try {
      const response = await axios.post('http://localhost:8080/api/theaters', theaterData);
      dispatch(createTheater(response.data));
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/manager/screen-setup', { 
          state: { theaterId: response.data.id }
        });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding theater');
      console.error('Error adding theater:', err);
    }
  };

  if (!managerId) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          Manager ID is required. Redirecting...
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {showSuccess && (
        <Alert variant="success" className="mb-4">
          Theater added successfully! Redirecting to screen setup...
        </Alert>
      )}
      
      {error && (
        <Alert variant="danger" className="mb-4" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}

      <Card>
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">Add New Theater</h5>
        </Card.Header>
        <Card.Body>
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Theater Name</Form.Label>
                  <Form.Control
                    required
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter theater name"
                  />
                  <Form.Control.Feedback type="invalid">
                    Please enter theater name
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    required
                    type="email"
                    name="emailAddress"
                    value={formData.emailAddress}
                    onChange={handleChange}
                    placeholder="Enter email address"
                  />
                  <Form.Control.Feedback type="invalid">
                    Please enter a valid email address
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    required
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    pattern="^\+?[0-9]{10,12}$"
                  />
                  <Form.Control.Feedback type="invalid">
                    Please enter a valid phone number
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    required
                    type="text"
                    name="location.address"
                    value={formData.location.address}
                    onChange={handleChange}
                    placeholder="Enter street address"
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>City</Form.Label>
                      <Form.Control
                        required
                        type="text"
                        name="location.city"
                        value={formData.location.city}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>State</Form.Label>
                      <Form.Control
                        required
                        type="text"
                        name="location.state"
                        value={formData.location.state}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>ZIP</Form.Label>
                      <Form.Control
                        required
                        type="text"
                        name="location.zipCode"
                        value={formData.location.zipCode}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter theater description"
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Amenities</Form.Label>
              <div className="d-flex flex-wrap gap-2">
                {amenitiesList.map(amenity => (
                  <Button
                    key={amenity}
                    variant={formData.amenities.includes(amenity) ? 'primary' : 'outline-primary'}
                    onClick={() => handleAmenityToggle(amenity)}
                    type="button"
                  >
                    {amenity}
                  </Button>
                ))}
              </div>
            </Form.Group>

            <div className="d-flex gap-2">
              <Button variant="primary" type="submit">
                Save and Continue to Screen Setup
              </Button>
              <Button variant="outline-secondary" onClick={() => navigate('/manager/theaters')}>
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AddTheater;