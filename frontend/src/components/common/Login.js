import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../../redux/slices/authSlice';
import { toast } from 'react-toastify';
import { login } from './../../services/authServices';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import './Login.css';

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

  const initializeGoogleButton = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: "615283018778-mm2l8s4p01f5lkgvv3gmu792sdssi2g8.apps.googleusercontent.com",
        callback: handleGoogleSuccess,
        auto_select: false,
        cancel_on_tap_outside: true
      });

      window.google.accounts.id.renderButton(
        document.getElementById('googleButton'),
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
      const res = await fetch('http://localhost:8080/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ idToken: response.credential })
      });
  
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Google login failed');
      }
  
      const data = await res.json();
  
      localStorage.setItem('token', data.token);
      dispatch(loginSuccess({
        email: data.user.email,
        token: data.token,
        role: data.role,
        id: data.user.id
      }));
      
      toast.success('Login successful!');
      navigateByRole(data.role);
    } catch (error) {
      console.log(error.message);
      toast.error(error.message);
      dispatch(loginFailure(error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      dispatch(loginStart());
      setLoading(true);
      const data = await login(credentials);
      localStorage.setItem('token', data.token);
      dispatch(loginSuccess({
        email: data.email, 
        token: data.token,
        role: data.role,
        id: data.id
      }));
      toast.success('Login successful!');
      navigateByRole(data.role);
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
      dispatch(loginFailure(error.message));
    } finally {
      setLoading(false);
    }
  };

  const navigateByRole = (role) => {
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
                
                <div id="googleButton" className="d-flex justify-content-center mt-4"></div>
                
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