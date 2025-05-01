import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../../../redux/slices/authSlice';
import { toast } from 'react-toastify';
import { login, googleAuth } from '../../../services/authServices';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import './Login.css';
import { fetchManagerTheaters } from '../../../redux/slices/theaterSlice';

// Correct the import path based on your actual file structure
import { GOOGLE_CLIENT_ID } from '../../../config/googleAuth'; // Adjust this path

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("Loading Google script...");
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      
      script.onload = () => {
        console.log("Google script loaded successfully");
        initializeGoogleButton();
      };
      
      script.onerror = (error) => {
        console.error("Error loading Google script:", error);
        setError("Failed to load Google authentication");
      };
    } else {
      console.log("Google API already available");
      initializeGoogleButton();
    }
  }, []);

  const initializeGoogleButton = () => {
    console.log("Initializing Google button with client ID:", GOOGLE_CLIENT_ID);
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleSuccess,
          auto_select: false,
          cancel_on_tap_outside: true
        });

        const buttonContainer = document.getElementById('googleButton');
        if (buttonContainer) {
          window.google.accounts.id.renderButton(
            buttonContainer,
            { 
              theme: 'outline', 
              size: 'large',
              width: buttonContainer.offsetWidth || 280
            }
          );
          console.log("Google button rendered successfully");
        } else {
          console.error("Google button container not found");
        }
      } catch (error) {
        console.error("Error initializing Google button:", error);
        setError("Failed to initialize Google authentication");
      }
    } else {
      console.error("Google accounts API not available");
    }
  };

  const handleGoogleSuccess = async (response) => {
    console.log("Google login callback triggered");
    try {
      setLoading(true);
      setError(null);
      dispatch(loginStart());
      
      console.log("Sending Google token to server...");
      // Use the googleAuth method from authService instead of direct fetch
      const data = await googleAuth(response.credential);
      console.log("Server response data:", data);
      
      // Handle different response structures
      const userId = data.user ? data.user.id : data.id;
      const userEmail = data.user ? data.user.email : data.email;
      const userRole = data.user ? data.user.role : data.role;
      
      if (!userId) {
        throw new Error("User ID not found in response");
      }
      
      dispatch(loginSuccess({
        email: userEmail,
        token: data.token,
        role: userRole,
        id: userId
      }));
      
      console.log("Login successful for role:", userRole);
      toast.success('Login successful!');
      
      if(userRole === 'THEATER_MANAGER'){
        console.log("Fetching theaters for manager ID:", userId);
        dispatch(fetchManagerTheaters(userId));
      }
      
      navigateByRole(userRole);
      
    } catch (error) {
      console.error("Google login error:", error);
      setError(error.message || "Login failed");
      toast.error(error.message || "Login failed");
      dispatch(loginFailure(error.message || "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form login initiated");
    try {
      dispatch(loginStart());
      setLoading(true);
      setError(null);
      
      const data = await login(credentials);
      console.log("Login response:", data);
      
      dispatch(loginSuccess({
        email: data.email, 
        token: data.token,
        role: data.role,
        id: data.id
      }));
      
      toast.success('Login successful!');
      
      if(data.role === 'THEATER_MANAGER'){
        console.log("Fetching theaters for manager ID:", data.id);
        dispatch(fetchManagerTheaters(data.id));
      }
      
      navigateByRole(data.role);
    } catch (error) {
      console.error("Form login error:", error);
      setError(error.message || "Login failed");
      toast.error(error.message || "Login failed");
      dispatch(loginFailure(error.message || "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  const navigateByRole = (role) => {
    console.log("Navigating based on role:", role);
    switch(role) {
      case "CUSTOMER":
        navigate('/');
        break;
      case "ADMIN":
        navigate('/admin');
        break;
      case "THEATER_MANAGER":
        navigate('/manager');
        break;
      default:
        console.warn("Unknown role:", role);
        navigate('/');
    }
  };

  return (
    <div className="login-page">
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={8} lg={6}>
            <Card className="login-card">
              <Card.Header className="text-center bg-transparent border-0 pt-4">
                <h2 className="login-title">Welcome Back</h2>
                {error && (
                  <Alert variant="danger" className="mt-3">
                    {error}
                  </Alert>
                )}
                
                <div id="googleButton" className="d-flex justify-content-center mt-4" style={{minHeight: '40px'}}></div>
                
                <div className="divider">
                  <span>Or sign in with email</span>
                </div>
              </Card.Header>

              <Card.Body className="px-4 py-4">
                <Form onSubmit={handleSubmit}>
                  <div className="login-form-container">
                    <Form.Group className="mb-3">
                      <Form.Label>Email address</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="Enter your email"
                        required
                        onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                      />
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Password</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Enter your password"
                        required
                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                      />
                    </Form.Group>

                    <Button 
                      variant="primary" 
                      type="submit" 
                      className="w-100 login-button"
                      disabled={loading}
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;