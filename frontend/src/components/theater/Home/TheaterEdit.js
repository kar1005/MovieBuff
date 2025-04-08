import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Row, Col, Alert, Spinner, Nav, Tab } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Settings, 
  Navigation, 
  User,
  Lock,
  Save,
  AlertTriangle,
  Info
} from 'lucide-react';
import { toast } from 'react-toastify';
import { 
  selectCurrentTheater, 
  fetchManagerTheaters,
  updateTheaterAsync
} from '../../../redux/slices/theaterSlice';
import { selectUser } from '../../../redux/slices/authSlice';
import userService from '../../../services/userService';

const TheaterManagerProfile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentTheater = useSelector(selectCurrentTheater);
  const currentUser = useSelector(selectUser);
  
  // Theater form state
  const [isTheaterSubmitting, setIsTheaterSubmitting] = useState(false);
  const [theaterValidated, setTheaterValidated] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Account form state
  const [isAccountSubmitting, setIsAccountSubmitting] = useState(false);
  const [accountValidated, setAccountValidated] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const initialTheaterState = {
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

  const initialAccountState = {
    id: '',
    username: '',
    email: '',
    phoneNumber: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    }
  };

  const [theater, setTheater] = useState(initialTheaterState);
  const [account, setAccount] = useState(initialAccountState);
  const [theaterErrors, setTheaterErrors] = useState({});
  const [accountErrors, setAccountErrors] = useState({});

  const amenitiesList = [
    'Parking',
    'Food Court',
    'Wheelchair Access',
    'Dolby Sound',
    'IMAX',
    '4K Projection',
    'VIP Lounge'
  ];

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      dispatch(fetchManagerTheaters(storedUserId));
      
      // Fetch user details
      const fetchUserDetails = async () => {
        try {
          const userData = await userService.getUserById(storedUserId);
          
          // Initialize account form with user data, excluding passwords
          setAccount({
            id: userData.id,
            username: userData.username || '',
            email: userData.email || '',
            phoneNumber: userData.phoneNumber || '',
            role: userData.role || 'THEATER_MANAGER',
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
            address: {
              street: userData.address?.street || '',
              city: userData.address?.city || '',
              state: userData.address?.state || '',
              zipCode: userData.address?.zipCode || ''
            }
          });
        } catch (error) {
          toast.error('Failed to fetch user details');
        }
      };
      
      fetchUserDetails();
    }
  }, [dispatch]);

  useEffect(() => {
    if (currentTheater) {
      setTheater(currentTheater);
    }
  }, [currentTheater]);

  // Theater validation
  const validateTheaterForm = () => {
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

    setTheaterErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Account validation
// Account validation
const validateAccountForm = () => {
  const newErrors = {};
  
  if (!account.username?.trim()) newErrors.username = 'Username is required';
  // Remove email validation since it's disabled
  
  if (account.phoneNumber && !/^\+?[0-9]{10,12}$/.test(account.phoneNumber)) {
    newErrors.phoneNumber = 'Invalid phone number format';
  }
  
  // Password validations only if changing password
  if (account.currentPassword || account.newPassword || account.confirmPassword) {
    if (!account.currentPassword) newErrors.currentPassword = 'Current password is required';
    if (!account.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (account.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    
    if (!account.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (account.newPassword !== account.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
  }
  
  setAccountErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

  // Submit theater form
  const handleTheaterSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateTheaterForm()) {
      setTheaterValidated(true);
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
  
    setIsTheaterSubmitting(true);
    
    try {
      await dispatch(updateTheaterAsync({ 
        id: theater.id, 
        data: theaterRequest 
      })).unwrap();
      
      toast.success('Theater information updated successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to update theater information');
      setTheaterErrors(error.errors || {});
    } finally {
      setIsTheaterSubmitting(false);
    }
  };

  // Submit account form
// Updated handleAccountSubmit function with correct password handling
const handleAccountSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateAccountForm()) {
    setAccountValidated(true);
    return;
  }
  
  setIsAccountSubmitting(true);
  
  try {
    // Create userData object for update
    const userData = {
      id: account.id,
      username: account.username,
      email: account.email,
      phoneNumber: account.phoneNumber,
      role: account.role,
      address: {
        street: account.address.street,
        city: account.address.city,
        state: account.address.state,
        zipCode: account.address.zipCode
      }
    };
    
    // Only include password if changing it
    if (account.currentPassword && account.newPassword && account.newPassword.length > 0) {
      userData.password = account.newPassword;
    }
    // If not changing password, don't include password field at all
    // Backend will preserve the existing password
    
    // Call the existing updateUser method
    await userService.updateUser(account.id, userData);
    
    // Clear password fields
    setAccount({
      ...account,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    
    toast.success('Account information updated successfully!');
  } catch (error) {
    toast.error(error.message || 'Failed to update account information');
    setAccountErrors(error.errors || {});
  } finally {
    setIsAccountSubmitting(false);
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

  const handleAccountChange = (field, value) => {
    setAccount(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressChange = (field, value) => {
    setAccount(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  // Get current location for theater
  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          
          // Ensure coordinates are stored as numbers, not strings
          const coordinates = [Number(latitude), Number(longitude)];
          
          // Update the location state with properly formatted coordinates
          setTheater(prev => ({
            ...prev,
            location: { 
              ...prev.location, 
              coordinates: coordinates,
              googleLink: `https://www.google.com/maps?q=${latitude},${longitude}`
            }
          }));
          
          setIsLoadingLocation(false);
          toast.success('Location updated successfully!');
        },
        (error) => {
          setIsLoadingLocation(false);
          toast.error('Failed to get location: ' + error.message);
        },
        // Add options for better accuracy
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
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
      <Tab.Container defaultActiveKey="theater">
        <Card>
          <Card.Header>
            <Nav variant="tabs">
              <Nav.Item>
                <Nav.Link eventKey="theater">
                  <Building size={18} className="me-2" />
                  Theater Profile
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="account">
                  <User size={18} className="me-2" />
                  Account Settings
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Card.Header>
          
          <Card.Body>
            <Tab.Content>
              {/* Theater Profile Tab */}
              <Tab.Pane eventKey="theater">
                <Alert variant="info" className="d-flex align-items-center">
                  <Info size={20} className="me-2" />
                  <span>This information is visible to customers. Update your theater details to showcase your venue.</span>
                </Alert>
                
                <Form noValidate validated={theaterValidated} onSubmit={handleTheaterSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Theater Name*</Form.Label>
                        <Form.Control
                          type="text"
                          value={theater.name}
                          onChange={(e) => setTheater({...theater, name: e.target.value})}
                          isInvalid={!!theaterErrors.name}
                        />
                        <Form.Control.Feedback type="invalid">
                          {theaterErrors.name}
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
                          isInvalid={!!theaterErrors.emailAddress}
                        />
                        <Form.Control.Feedback type="invalid">
                          {theaterErrors.emailAddress}
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
                          isInvalid={!!theaterErrors.phoneNumber}
                        />
                        <Form.Control.Feedback type="invalid">
                          {theaterErrors.phoneNumber}
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
                          isInvalid={!!theaterErrors.address}
                        />
                        <Form.Control.Feedback type="invalid">
                          {theaterErrors.address}
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
                              isInvalid={!!theaterErrors.city}
                            />
                            <Form.Control.Feedback type="invalid">
                              {theaterErrors.city}
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
                              isInvalid={!!theaterErrors.state}
                            />
                            <Form.Control.Feedback type="invalid">
                              {theaterErrors.state}
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
                              isInvalid={!!theaterErrors.zipCode}
                            />
                            <Form.Control.Feedback type="invalid">
                              {theaterErrors.zipCode}
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

                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={isTheaterSubmitting}
                    className="d-flex align-items-center"
                  >
                    {isTheaterSubmitting ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} className="me-2" />
                        Save Theater Information
                      </>
                    )}
                  </Button>
                </Form>
              </Tab.Pane>
              
              {/* Account Settings Tab */}
              <Tab.Pane eventKey="account">
                <Alert variant="info" className="d-flex align-items-center">
                  <Info size={20} className="me-2" />
                  <span>These are your account credentials which will be used for logging in and account-related activities.</span>
                </Alert>
                
                <Form noValidate validated={accountValidated} onSubmit={handleAccountSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Username*</Form.Label>
                        <Form.Control
                          type="text"
                          value={account.username}
                          onChange={(e) => handleAccountChange('username', e.target.value)}
                          isInvalid={!!accountErrors.username}
                        />
                        <Form.Control.Feedback type="invalid">
                          {accountErrors.username}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email Address*</Form.Label>
                      <Form.Control
                        type="email"
                        value={account.email}
                        onChange={(e) => handleAccountChange('email', e.target.value)}
                        isInvalid={!!accountErrors.email}
                        disabled={true} // Disable the email field
                        className="bg-light" // Optional: add light background to indicate disabled state
                      />
                      <Form.Text className="text-muted">
                        Email address cannot be changed as it's used for account identification.
                      </Form.Text>
                      <Form.Control.Feedback type="invalid">
                        {accountErrors.email}
                      </Form.Control.Feedback>
                    </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Phone Number</Form.Label>
                        <Form.Control
                          type="tel"
                          value={account.phoneNumber}
                          onChange={(e) => handleAccountChange('phoneNumber', e.target.value)}
                          isInvalid={!!accountErrors.phoneNumber}
                        />
                        <Form.Control.Feedback type="invalid">
                          {accountErrors.phoneNumber}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Card className="mb-3">
                    <Card.Header>
                      <h6 className="mb-0">Address</h6>
                    </Card.Header>
                    <Card.Body>
                      <Form.Group className="mb-3">
                        <Form.Label>Street</Form.Label>
                        <Form.Control
                          type="text"
                          value={account.address?.street}
                          onChange={(e) => handleAddressChange('street', e.target.value)}
                        />
                      </Form.Group>
                      
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>City</Form.Label>
                            <Form.Control
                              type="text"
                              value={account.address?.city}
                              onChange={(e) => handleAddressChange('city', e.target.value)}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <Form.Group className="mb-3">
                            <Form.Label>State</Form.Label>
                            <Form.Control
                              type="text"
                              value={account.address?.state}
                              onChange={(e) => handleAddressChange('state', e.target.value)}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <Form.Group className="mb-3">
                            <Form.Label>ZIP Code</Form.Label>
                            <Form.Control
                              type="text"
                              value={account.address?.zipCode}
                              onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                  
                  <Card className="mb-3">
                    <Card.Header className="d-flex align-items-center">
                      <Lock size={18} className="me-2" />
                      <h6 className="mb-0">Change Password</h6>
                    </Card.Header>
                    <Card.Body>
                      <Alert variant="warning" className="d-flex align-items-center">
                        <AlertTriangle size={20} className="me-2" />
                        <span>Leave these fields blank if you don't want to change your password.</span>
                      </Alert>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Current Password</Form.Label>
                        <Form.Control
                          type={passwordVisible ? "text" : "password"}
                          value={account.currentPassword}
                          onChange={(e) => handleAccountChange('currentPassword', e.target.value)}
                          isInvalid={!!accountErrors.currentPassword}
                        />
                        <Form.Control.Feedback type="invalid">
                          {accountErrors.currentPassword}
                        </Form.Control.Feedback>
                      </Form.Group>
                      
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>New Password</Form.Label>
                            <Form.Control
                              type={passwordVisible ? "text" : "password"}
                              value={account.newPassword}
                              onChange={(e) => handleAccountChange('newPassword', e.target.value)}
                              isInvalid={!!accountErrors.newPassword}
                            />
                            <Form.Control.Feedback type="invalid">
                              {accountErrors.newPassword}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Confirm New Password</Form.Label>
                            <Form.Control
                              type={passwordVisible ? "text" : "password"}
                              value={account.confirmPassword}
                              onChange={(e) => handleAccountChange('confirmPassword', e.target.value)}
                              isInvalid={!!accountErrors.confirmPassword}
                            />
                            <Form.Control.Feedback type="invalid">
                              {accountErrors.confirmPassword}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      </Row>
                      
                      <Form.Check 
                        type="checkbox"
                        id="show-password"
                        label="Show password"
                        checked={passwordVisible}
                        onChange={() => setPasswordVisible(!passwordVisible)}
                        className="mb-0"
                      />
                    </Card.Body>
                  </Card>

                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={isAccountSubmitting}
                    className="d-flex align-items-center"
                  >
                    {isAccountSubmitting ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} className="me-2" />
                        Save Account Information
                      </>
                    )}
                  </Button>
                </Form>
              </Tab.Pane>
            </Tab.Content>
          </Card.Body>
        </Card>
      </Tab.Container>
    </Container>
  );
};

export default TheaterManagerProfile;