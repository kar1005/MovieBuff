import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { register, googleAuth } from '../../../services/authServices';
import { Card, Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import './Register.css';
import { GOOGLE_CLIENT_ID } from '../../../config/googleAuth';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    role: 'CUSTOMER',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      coordinates: [0, 0],
    }
  });
  const [error, setError] = useState(null);

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
      console.log("Initializing Google button");
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,  // Import from config file
          callback: handleGoogleSuccess,
          auto_select: false,
          cancel_on_tap_outside: true
        });
  
        const buttonElement = document.getElementById('googleRegisterButton');
        if (buttonElement) {
          window.google.accounts.id.renderButton(
            buttonElement,
            { 
              theme: 'outline', 
              size: 'large',
              width: buttonElement.offsetWidth || 280
            }
          );
        } else {
          console.error("Google button element not found");
        }
      } catch (error) {
        console.error("Error initializing Google button:", error);
      }
    } else {
      console.error("Google API not available");
    }
  };

  const handleGoogleSuccess = async (response) => {
    try {
      setLoading(true);
      setError(null);
      console.log("Google auth response received:", response);
      
      // Use the googleAuth method from authService
      const data = await googleAuth(response.credential);
      console.log("Success response:", data);
      
      navigate('/login');
      toast.success('Google registration successful! Please log in.');
    } catch (err) {
      console.error('Google auth error:', err);
      setError(err.message || 'Google registration failed');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const registrationData = { ...formData };
      delete registrationData.confirmPassword;
      await register(registrationData);
      toast.success('Registration successful! Please log in.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col xs={12} md={10} lg={8}>
            <Card className="register-card">
              <Card.Header className="text-center bg-transparent border-0 pt-4">
                <h2 className="register-title">Create an Account</h2>
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
                    className="w-100 mt-4 register-button"
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

export default Register;