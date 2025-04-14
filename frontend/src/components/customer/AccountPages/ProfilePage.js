// src/components/customer/ProfilePage/CustomerProfilePage.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, ListGroup, Badge, Tab, Nav } from 'react-bootstrap';
import { updateUserProfile, updateUserPreferences } from '../../../redux/slices/customerSlice';
import { getUserReviews } from '../../../redux/slices/reviewSlice';
import { getUserBookings } from '../../../redux/slices/bookingSlice';
import userService from '../../../services/userService';
import { User, Key, Ticket, Heart, Star } from 'lucide-react';
import { toast } from 'react-toastify';
import './ProfilePage.css';

const CustomerProfilePage = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, id: authUserId } = useSelector((state) => state.auth);
  const { userReviews, reviewsLoading } = useSelector((state) => ({
    userReviews: state.reviews?.userReviews || [],
    reviewsLoading: state.reviews?.isLoading || false,
  }));
  const { userBookings, bookingsLoading } = useSelector((state) => ({
    userBookings: state.booking?.userBookings || [],
    bookingsLoading: state.booking?.isLoading || false,
  }));
  const { isLoading: profileLoading, error, success, message } = useSelector((state) => state.customer);

  const [activeKey, setActiveKey] = useState('profile');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
    preferences: {
      favoriteGenres: [],
      preferredLanguages: [],
      preferredTheaters: [],
    },
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [statusMessage, setStatusMessage] = useState({ show: false, type: '', message: '' });
  const [fetchingUser, setFetchingUser] = useState(false);
  
  // Get userId from localStorage if not available in Redux state
  const userId = authUserId || localStorage.getItem('userId');

  // Genre and language options
  const genreOptions = ['Action', 'Adventure', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Fantasy', 'Animation'];
  const languageOptions = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Punjabi'];

  // Fetch user profile data
  const fetchUserProfile = async () => {
    if (!userId) {
      setStatusMessage({ 
        show: true, 
        type: 'danger', 
        message: 'User ID not found. Please login again.' 
      });
      return;
    }

    try {
      setFetchingUser(true);
      const userData = await userService.getUserById(userId);
      
      // Update form data with user data
      setFormData({
        username: userData.username || '',
        email: userData.email || '',
        phoneNumber: userData.phoneNumber || '',
        address: {
          street: userData.address?.street || '',
          city: userData.address?.city || '',
          state: userData.address?.state || '',
          zipCode: userData.address?.zipCode || '',
        },
        preferences: {
          favoriteGenres: userData.preferences?.favoriteGenres || [],
          preferredLanguages: userData.preferences?.preferredLanguages || [],
          preferredTheaters: userData.preferences?.preferredTheaters || [],
        },
      });
      
      console.log('User profile fetched successfully:', userData);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setStatusMessage({ 
        show: true, 
        type: 'danger', 
        message: 'Failed to fetch your profile data. Please try again later.' 
      });
      toast.error('Failed to fetch profile data');
    } finally {
      setFetchingUser(false);
    }
  };

  useEffect(() => {
    if (userId) {
      // Fetch user data from backend
      fetchUserProfile();
      
      // Fetch user bookings
      dispatch(getUserBookings(userId));
      
      // Fetch user reviews
      dispatch(getUserReviews(userId));
    }
  }, [dispatch, userId]);

  // Update form if user data changes in Redux
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || formData.username,
        email: user.email || formData.email,
        phoneNumber: user.phoneNumber || formData.phoneNumber,
        address: {
          street: user.address?.street || formData.address.street,
          city: user.address?.city || formData.address.city,
          state: user.address?.state || formData.address.state,
          zipCode: user.address?.zipCode || formData.address.zipCode,
        },
        preferences: {
          favoriteGenres: user.preferences?.favoriteGenres || formData.preferences.favoriteGenres,
          preferredLanguages: user.preferences?.preferredLanguages || formData.preferences.preferredLanguages,
          preferredTheaters: user.preferences?.preferredTheaters || formData.preferences.preferredTheaters,
        },
      });
    }
  }, [user]);

  useEffect(() => {
    if (success) {
      setStatusMessage({ show: true, type: 'success', message });
      toast.success(message || 'Profile updated successfully');
      
      // Hide success message after 3 seconds
      const timer = setTimeout(() => {
        setStatusMessage({ show: false, type: '', message: '' });
      }, 3000);
      
      return () => clearTimeout(timer);
    }
    if (error) {
      setStatusMessage({ show: true, type: 'danger', message: error });
      toast.error(error || 'An error occurred');
    }
  }, [success, error, message]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value,
    });
  };

  const handlePreferenceChange = (type, value) => {
    const currentPreferences = [...formData.preferences[type]];
    const index = currentPreferences.indexOf(value);
    
    if (index === -1) {
      // Add preference
      currentPreferences.push(value);
    } else {
      // Remove preference
      currentPreferences.splice(index, 1);
    }
    
    setFormData({
      ...formData,
      preferences: {
        ...formData.preferences,
        [type]: currentPreferences,
      },
    });
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    dispatch(updateUserProfile({ id: userId, profileData: formData }));
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setStatusMessage({ show: true, type: 'danger', message: 'Passwords do not match' });
      toast.error('Passwords do not match');
      return;
    }
    
    dispatch(updateUserProfile({ 
      id: userId, 
      profileData: { 
        password: passwordData.newPassword,
      } 
    }));
    
    // Clear password fields
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const handlePreferencesSubmit = (e) => {
    e.preventDefault();
    dispatch(updateUserPreferences({ 
      id: userId, 
      preferences: formData.preferences 
    }));
  };

  const handleRefreshProfile = () => {
    fetchUserProfile();
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Helper function to get booking status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'success';
      case 'CANCELLED': return 'danger';
      case 'REFUNDED': return 'info';
      case 'PAYMENT_PENDING': return 'warning';
      case 'EXPIRED': return 'secondary';
      default: return 'primary';
    }
  };

  const isLoading = profileLoading || bookingsLoading || reviewsLoading || fetchingUser;

  return (
    <div className="profile-page">
      <Container>
        <Row className="profile-content">
          <Col md={3} className="profile-sidebar-container">
            <Card className="profile-avatar-card">
              <Card.Body className="text-center">
                <div className="profile-avatar">
                  <User size={40} />
                </div>
                <h5 className="mt-3 mb-1">{formData.username || "User"}</h5>
                <p className="text-muted small">{formData.email || ""}</p>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="refresh-button mt-2"
                  onClick={handleRefreshProfile}
                  disabled={fetchingUser}
                >
                  {fetchingUser ? 'Refreshing...' : 'Refresh Profile'}
                </Button>
              </Card.Body>
            </Card>
            
            <Card className="profile-nav-card">
              <Nav variant="pills" className="flex-column" activeKey={activeKey} onSelect={setActiveKey}>
                <Nav.Item>
                  <Nav.Link eventKey="profile" className="d-flex align-items-center">
                    <User size={18} className="nav-icon" />
                    <span>Profile Information</span>
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="password" className="d-flex align-items-center">
                    <Key size={18} className="nav-icon" />
                    <span>Change Password</span>
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="bookings" className="d-flex align-items-center">
                    <Ticket size={18} className="nav-icon" />
                    <span>Booking History</span>
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="preferences" className="d-flex align-items-center">
                    <Heart size={18} className="nav-icon" />
                    <span>Preferences</span>
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="reviews" className="d-flex align-items-center">
                    <Star size={18} className="nav-icon" />
                    <span>My Reviews</span>
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card>
          </Col>
          
          <Col md={9}>
            {statusMessage.show && (
              <Alert 
                variant={statusMessage.type} 
                dismissible 
                onClose={() => setStatusMessage({ show: false, type: '', message: '' })}
                className="status-alert"
              >
                {statusMessage.message}
              </Alert>
            )}
            
            {isLoading && (
              <div className="loading-spinner">
                <Spinner animation="border" variant="primary" />
              </div>
            )}
            
            <Tab.Content>
              {/* Profile Information Tab */}
              <Tab.Pane active={activeKey === 'profile'}>
                <Card className="content-card">
                  <Card.Header className="content-header">
                    <h5 className="mb-0">Profile Information</h5>
                  </Card.Header>
                  <Card.Body>
                    <Form onSubmit={handleProfileSubmit}>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Username</Form.Label>
                            <Form.Control
                              type="text"
                              name="username"
                              value={formData.username}
                              onChange={handleInputChange}
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              required
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Phone Number</Form.Label>
                        <Form.Control
                          type="tel"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                        />
                      </Form.Group>
                      
                      <h5 className="section-title">Address Information</h5>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Street Address</Form.Label>
                        <Form.Control
                          type="text"
                          name="address.street"
                          value={formData.address.street}
                          onChange={handleInputChange}
                        />
                      </Form.Group>
                      
                      <Row>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>City</Form.Label>
                            <Form.Control
                              type="text"
                              name="address.city"
                              value={formData.address.city}
                              onChange={handleInputChange}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>State</Form.Label>
                            <Form.Control
                              type="text"
                              name="address.state"
                              value={formData.address.state}
                              onChange={handleInputChange}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>ZIP Code</Form.Label>
                            <Form.Control
                              type="text"
                              name="address.zipCode"
                              value={formData.address.zipCode}
                              onChange={handleInputChange}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      
                      <div className="d-flex justify-content-end mt-3">
                        <Button variant="primary" type="submit" className="save-button">
                          Save Changes
                        </Button>
                      </div>
                    </Form>
                  </Card.Body>
                </Card>
              </Tab.Pane>
              
              {/* Change Password Tab */}
              <Tab.Pane active={activeKey === 'password'}>
                <Card className="content-card">
                  <Card.Header className="content-header">
                    <h5 className="mb-0">Change Password</h5>
                  </Card.Header>
                  <Card.Body>
                    <Form onSubmit={handlePasswordSubmit}>
                      <Form.Group className="mb-3">
                        <Form.Label>Current Password</Form.Label>
                        <Form.Control
                          type="password"
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          required
                        />
                      </Form.Group>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>New Password</Form.Label>
                        <Form.Control
                          type="password"
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          required
                          minLength={6}
                        />
                      </Form.Group>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Confirm New Password</Form.Label>
                        <Form.Control
                          type="password"
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          required
                          minLength={6}
                        />
                      </Form.Group>
                      
                      <div className="password-rules mt-4 mb-4">
                        <h6>Password Requirements:</h6>
                        <ul className="small text-muted">
                          <li>At least 6 characters long</li>
                          <li>Include at least one uppercase letter</li>
                          <li>Include at least one number</li>
                          <li>Include at least one special character</li>
                        </ul>
                      </div>
                      
                      <div className="d-flex justify-content-end mt-3">
                        <Button variant="primary" type="submit" className="save-button">
                          Update Password
                        </Button>
                      </div>
                    </Form>
                  </Card.Body>
                </Card>
              </Tab.Pane>
              
              {/* Booking History Tab */}
              <Tab.Pane active={activeKey === 'bookings'}>
                <Card className="content-card">
                  <Card.Header className="content-header">
                    <h5 className="mb-0">Booking History</h5>
                  </Card.Header>
                  <Card.Body>
                    {userBookings.length === 0 ? (
                      <div className="empty-state">
                        <Ticket size={48} strokeWidth={1.5} />
                        <h5>No Bookings Found</h5>
                        <p>You haven't made any bookings yet.</p>
                      </div>
                    ) : (
                      <ListGroup variant="flush" className="booking-list">
                        {userBookings.map((booking) => (
                          <ListGroup.Item key={booking.id} className="booking-item">
                            <div className="booking-header">
                              <div className="booking-title">
                                <h5>{booking.movieTitle || "Movie"}</h5>
                                <Badge bg={getStatusBadgeColor(booking.status)}>
                                  {booking.status}
                                </Badge>
                              </div>
                              <div className="booking-number">
                                Booking #: {booking.bookingNumber}
                              </div>
                            </div>
                            
                            <div className="booking-details">
                              <div className="booking-info">
                                <p>
                                  <strong>Theater:</strong> {booking.theaterName}
                                </p>
                                <p>
                                  <strong>Date & Time:</strong> {formatDate(booking.showTime)}
                                </p>
                                <p>
                                  <strong>Seats:</strong> {booking.seats?.map(seat => seat.seatId).join(', ')}
                                </p>
                                <p>
                                  <strong>Amount:</strong> ₹{booking.totalAmount}
                                </p>
                              </div>
                              
                              <div className="booking-actions">
                                <Button variant="outline-primary" size="sm">
                                  View Details
                                </Button>
                                {booking.status === 'CONFIRMED' && (
                                  <Button variant="outline-success" size="sm" className="ms-2">
                                    Download Ticket
                                  </Button>
                                )}
                              </div>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    )}
                  </Card.Body>
                </Card>
              </Tab.Pane>
              
              {/* Preferences Tab */}
              <Tab.Pane active={activeKey === 'preferences'}>
                <Card className="content-card">
                  <Card.Header className="content-header">
                    <h5 className="mb-0">Preferences</h5>
                  </Card.Header>
                  <Card.Body>
                    <Form onSubmit={handlePreferencesSubmit}>
                      <Form.Group className="mb-4">
                        <Form.Label>Favorite Genres</Form.Label>
                        <div className="preference-chips">
                          {genreOptions.map(genre => (
                            <Button
                              key={genre}
                              variant={formData.preferences.favoriteGenres.includes(genre) ? "primary" : "outline-primary"}
                              className="preference-chip"
                              onClick={() => handlePreferenceChange('favoriteGenres', genre)}
                              type="button"
                            >
                              {genre}
                            </Button>
                          ))}
                        </div>
                      </Form.Group>
                      
                      <Form.Group className="mb-4">
                        <Form.Label>Preferred Languages</Form.Label>
                        <div className="preference-chips">
                          {languageOptions.map(language => (
                            <Button
                              key={language}
                              variant={formData.preferences.preferredLanguages.includes(language) ? "primary" : "outline-primary"}
                              className="preference-chip"
                              onClick={() => handlePreferenceChange('preferredLanguages', language)}
                              type="button"
                            >
                              {language}
                            </Button>
                          ))}
                        </div>
                      </Form.Group>
                      
                      <div className="d-flex justify-content-end mt-3">
                        <Button variant="primary" type="submit" className="save-button">
                          Save Preferences
                        </Button>
                      </div>
                    </Form>
                  </Card.Body>
                </Card>
              </Tab.Pane>
              
              {/* Reviews Tab */}
              <Tab.Pane active={activeKey === 'reviews'}>
                <Card className="content-card">
                  <Card.Header className="content-header">
                    <h5 className="mb-0">My Reviews</h5>
                  </Card.Header>
                  <Card.Body>
                    {userReviews.length === 0 ? (
                      <div className="empty-state">
                        <Star size={48} strokeWidth={1.5} />
                        <h5>No Reviews Found</h5>
                        <p>You haven't written any reviews yet.</p>
                      </div>
                    ) : (
                      <ListGroup variant="flush" className="review-list">
                        {userReviews.map((review) => (
                          <ListGroup.Item key={review.id} className="review-item">
                            <div className="review-header">
                              <div className="review-title">
                                <h5>{review.movieTitle || "Movie"}</h5>
                                <Badge 
                                  bg={review.status === 'APPROVED' ? 'success' : 
                                    review.status === 'PENDING' ? 'warning' : 'danger'}
                                >
                                  {review.status}
                                </Badge>
                              </div>
                              <div className="review-date">
                                {formatDate(review.createdAt)}
                              </div>
                            </div>
                            
                            <div className="review-rating mb-2">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star
                                  key={i}
                                  size={16}
                                  fill={i < review.rating ? "#facc15" : "none"}
                                  stroke={i < review.rating ? "#facc15" : "#64748b"}
                                />
                              ))}
                              <span className="ms-2">({review.rating}/5)</span>
                            </div>
                            
                            <p className="review-content">{review.content}</p>
                            
                            <div className="review-footer">
                              <div className="review-stats">
                                <span className="me-3">
                                  <strong>Helpful:</strong> {review.helpfulCount || 0}
                                </span>
                                <span>
                                  <strong>Comments:</strong> {review.reports?.length || 0}
                                </span>
                              </div>
                              
                              <div className="review-actions">
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  disabled={review.status !== 'APPROVED'}
                                >
                                  Edit
                                </Button>
                              </div>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    )}
                  </Card.Body>
                </Card>
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default CustomerProfilePage;