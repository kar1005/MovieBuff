import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../../../services/authServices';
import { Card, Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
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
      const registrationData = { ...formData };
      delete registrationData.confirmPassword;
      await register(registrationData);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
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
                  >
                    Create Account
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