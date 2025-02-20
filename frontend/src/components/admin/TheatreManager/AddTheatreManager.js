import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerTManager } from '../../../services/authServices';
import { createTheater } from '../../../redux/slices/theaterSlice';
import { useDispatch } from 'react-redux';

import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import './AddTheatreManager.css';

const AddTheatreManager = ({handleClick}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    role: 'THEATER_MANAGER',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      coordinates: [0, 0],
    }
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const initializeGoogleButton = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: "615283018778-mm2l8s4p01f5lkgvv3gmu792sdssi2g8.apps.googleusercontent.com",
        callback: handleGoogleSuccess,
        auto_select: false,
        cancel_on_tap_outside: true
      });

      window.google.accounts.id.renderButton(
        document.getElementById('googleRegisterButton'),
        { 
          theme: 'outline', 
          size: 'large',
          width: 280
        }
      );
    }
  };

  const handleGoogleSuccess = async (response) => {
    try {
      setLoading(true);
      const result = await fetch('http://localhost:8080/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: response.credential
        })
      });

      if (!result.ok) {
        const errorData = await result.text();
        throw new Error(errorData);
      }

      const data = await result.json();
      navigate('/login');
      toast.success('Google registration successful! Please log in.');
    } catch (err) {
      console.error('Google auth error:', err);
      setError(err.message || 'Google registration failed');
      toast.error(err.message || 'Google registration failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      
      script.onload = () => {
        initializeGoogleButton();
      };
    } else {
      initializeGoogleButton();
    }
  }, []);

  const dispatch = useDispatch();  // Add this at the top of your component

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Input validation
    try {
      if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
        throw new Error('Please fill in all required fields');
      }
  
      if (!formData.phoneNumber || !formData.address?.street || !formData.address?.city || 
          !formData.address?.state || !formData.address?.zipCode) {
        throw new Error('Please provide complete contact and address information');
      }
  
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }
  
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }
  
      // Phone validation (basic)
      const phoneRegex = /^\+?[0-9]{10,12}$/;
      if (!phoneRegex.test(formData.phoneNumber)) {
        throw new Error('Please enter a valid phone number');
      }
  
      setLoading(true);
      setError(null);
  
      // Step 1: Register Theater Manager
      const registrationData = { ...formData };
      delete registrationData.confirmPassword;
      
      let managerId;
      try {
        const managerResponse = await registerTManager(registrationData);
        managerId = managerResponse.id;
        console.log('Theater manager registered successfully!', managerId);
      } catch (managerError) {
        const errorMsg = managerError.response?.data?.message || 'Failed to register theater manager';
        throw new Error(errorMsg);
      }
  
      // Step 2: Create Theater
      const theaterRequest = {
        name: `${formData.username}'s Theater`,
        managerId: managerId,
        amenities: [],
        description: '',
        emailAddress: formData.email,
        phoneNumber: formData.phoneNumber,
        totalScreens: 0,
        location: {
          address: formData.address.street,
          city: formData.address.city,
          state: formData.address.state,
          zipCode: formData.address.zipCode,
          coordinates: formData.address.coordinates || [0, 0],
          GoogleLink: ''
        }
      };
  
      try {
        await dispatch(createTheater(theaterRequest)).unwrap();
        toast.success('Registration successful! Please check your email for credentials.');
        navigate('/login');
      } catch (theaterError) {
        // If theater creation fails, we should log this and notify the admin
        console.error('Theater creation failed:', theaterError);
        
        // Still allow the user to proceed since their account was created
        toast.warning('Account created successfully, but theater setup needs attention. Our team will contact you shortly.');
        navigate('/login');
      }
  
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="manager-page">
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} md={10} lg={8}>
            <Card className="manager-card">
              <Card.Header className="text-center bg-transparent border-0 pt-4">
                <h2 className="manager-title">Add Theater Manager</h2>
                {error && (
                  <Alert variant="danger" className="mt-3">
                    {error}
                  </Alert>
                )}
                
                <div id="googleRegisterButton" className="d-flex justify-content-center mt-4"></div>
                
                <div className="divider">
                  <span>Or register with email</span>
                </div>
              </Card.Header>

              <Card.Body className="px-4 py-4">
                <Form onSubmit={handleSubmit}>
                  {/* Personal Information Section */}
                  <div className="section-container">
                    <h3 className="section-title">Personal Information</h3>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Username</Form.Label>
                          <Form.Control
                            type="text"
                            name="username"
                            required
                            onChange={handleChange}
                            placeholder="Enter username"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            required
                            onChange={handleChange}
                            placeholder="Enter email"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Password</Form.Label>
                          <Form.Control
                            type="password"
                            name="password"
                            required
                            onChange={handleChange}
                            placeholder="Enter password"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Confirm Password</Form.Label>
                          <Form.Control
                            type="password"
                            name="confirmPassword"
                            required
                            onChange={handleChange}
                            placeholder="Confirm password"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Phone Number</Form.Label>
                          <Form.Control
                            type="tel"
                            name="phoneNumber"
                            onChange={handleChange}
                            placeholder="Enter phone number"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>

                  {/* Address Section */}
                  <div className="section-container">
                    <h3 className="section-title">Address Details</h3>
                    <Row>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Street Address</Form.Label>
                          <Form.Control
                            type="text"
                            name="address.street"
                            onChange={handleChange}
                            placeholder="Enter street address"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>City</Form.Label>
                          <Form.Control
                            type="text"
                            name="address.city"
                            onChange={handleChange}
                            placeholder="Enter city"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>State</Form.Label>
                          <Form.Control
                            type="text"
                            name="address.state"
                            onChange={handleChange}
                            placeholder="Enter state"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>ZIP Code</Form.Label>
                          <Form.Control
                            type="text"
                            name="address.zipCode"
                            onChange={handleChange}
                            placeholder="Enter ZIP code"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>

                  <Button 
                    variant="primary" 
                    type="submit" 
                    className="w-100 mt-4 manager-button"
                    disabled={loading}
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AddTheatreManager;