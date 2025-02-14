import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Card, Badge, Spinner, Alert, Button, Modal, Form, Toast } from 'react-bootstrap';
import { 
  Building2, 
  MonitorPlay, 
  Calendar, 
  BarChart3, 
  Film, 
  Users,
  MapPin,
  Mail,
  Phone,
  Edit3
} from 'lucide-react';
import { 
  fetchManagerTheaters,
  fetchTheaterStats,
  updateTheaterAsync,
  
  selectTheaterStats,
  selectLoading,
  selectError
} from '../../redux/slices/theaterSlice';
import { selectUser } from '../../redux/slices/authSlice';
import './TheaterManagerHome.css';

const TheaterManagerHome = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const theaters = useSelector(fetchManagerTheaters);
  const currentTheater = theaters?.[0]; // Assuming we're showing the first theater
  const stats = useSelector(selectTheaterStats);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);





  console.log('=== TheaterManagerHome Component Initial State ===');
  console.log('User object:', user);
  console.log('User ID:', user?.id);
  console.log('User Role:', user?.role);
  console.log('Theaters:', theaters);
  console.log('Current Theater:', currentTheater);
  console.log('Loading State:', loading);
  console.log('Error State:', error);





  // State for notifications
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // State for edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    emailAddress: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    amenities: ''
  });

  useEffect(() => {
    if (user?.id) {
      console.log("Fetching theaters for manager ID:", user.id);
      dispatch(fetchManagerTheaters(user.id))
        .unwrap()
        .then((result) => {
          if (!result || result.length === 0) {
            console.log("No theaters found, redirecting to add theater page");
            navigate(`/manager/theaters/add?managerId=${user.id}`);
          } else {
            console.log("Theaters found, fetching stats");
            dispatch(fetchTheaterStats(result[0].id)); // Fetch stats for first theater
          }
        })
        .catch((error) => {
          console.error('Error fetching theaters:', error);
          navigate(`/manager/theaters/add?managerId=${user.id}`);
        });
    }
  }, [dispatch, user, navigate]);

  useEffect(() => {
    if (currentTheater) {
      setEditForm({
        name: currentTheater.name || '',
        description: currentTheater.description || '',
        emailAddress: currentTheater.emailAddress || '',
        phoneNumber: currentTheater.phoneNumber || '',
        address: currentTheater.location?.address || '',
        city: currentTheater.location?.city || '',
        state: currentTheater.location?.state || '',
        zipCode: currentTheater.location?.zipCode || '',
        amenities: (currentTheater.amenities || []).join(', ')
      });
    }
  }, [currentTheater]);

  const features = [
    {
      title: 'Manage Screens',
      description: 'Design and configure theater screen layouts',
      icon: MonitorPlay,
      link: `/manager/theaters/${currentTheater?.id}/screens`,
      color: 'success',
      bgColor: 'rgba(25, 135, 84, 0.1)'
    },
    {
      title: 'Show Schedule',
      description: 'Manage movie show timings and pricing',
      icon: Calendar,
      link: `/manager/theaters/${currentTheater?.id}/shows`,
      color: 'primary',
      bgColor: 'rgba(13, 110, 253, 0.1)'
    },
    {
      title: 'Analytics',
      description: 'View theater performance and revenue analytics',
      icon: BarChart3,
      link: `/manager/theaters/${currentTheater?.id}/analytics`,
      color: 'warning',
      bgColor: 'rgba(255, 193, 7, 0.1)'
    }
  ];

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const updatedTheater = {
      ...currentTheater,
      name: editForm.name,
      description: editForm.description,
      emailAddress: editForm.emailAddress,
      phoneNumber: editForm.phoneNumber,
      location: {
        ...currentTheater.location,
        address: editForm.address,
        city: editForm.city,
        state: editForm.state,
        zipCode: editForm.zipCode
      },
      amenities: editForm.amenities.split(',').map(item => item.trim()).filter(Boolean)
    };
    
    try {
      await dispatch(updateTheaterAsync({ 
        id: currentTheater.id, 
        theater: updatedTheater 
      })).unwrap();
      setShowEditModal(false);
      setShowToast(true);
      setToastMessage('Theater details updated successfully!');
      // Refresh theater data
      dispatch(fetchManagerTheaters(user.id));
    } catch (error) {
      setShowToast(true);
      setToastMessage('Error updating theater details. Please try again.');
      console.error('Error updating theater:', error);
    }
  };

  if (loading && !window.location.pathname.includes('/add')) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (error && !window.location.pathname.includes('/add')) {
    return (
      <Container className="p-4">
        <Alert variant="danger">
          {error}
        </Alert>
      </Container>
    );
  }

  if (!currentTheater) {
    navigate(`/manager/theaters/add?managerId=${user?.id}`);
    return null;
  }

  return (
    <Container fluid className="p-4">
      {currentTheater && (
        <>
          {/* Theater Overview Card */}
          <Card className="mb-4 shadow-sm tmanager">
            <Card.Body>
              <Row>
                <Col md={8}>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h2 className="mb-0">{currentTheater.name}</h2>
                    <Button 
                      variant="outline-primary" 
                      className="d-flex align-items-center gap-2"
                      onClick={() => setShowEditModal(true)}
                    >
                      <Edit3 size={18} />
                      Edit Details
                    </Button>
                  </div>
                  <p className="text-muted mb-4">{currentTheater.description}</p>
                  <div className="d-flex flex-wrap gap-4 mb-4">
                    <div className="d-flex align-items-center">
                      <MapPin size={20} className="me-2 text-primary" />
                      <span>{`${currentTheater.location.address}, ${currentTheater.location.city}`}</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <Mail size={20} className="me-2 text-primary" />
                      <span>{currentTheater.emailAddress}</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <Phone size={20} className="me-2 text-primary" />
                      <span>{currentTheater.phoneNumber}</span>
                    </div>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    {currentTheater.amenities?.map((amenity, index) => (
                      <Badge 
                        key={index} 
                        bg="light" 
                        text="dark" 
                        className="px-3 py-2"
                      >
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </Col>
                <Col md={4}>
                  <Row className="g-3">
                    <Col xs={6}>
                      <Card className="text-center h-100 border-0 bg-light">
                        <Card.Body>
                          <Film className="mb-2 text-primary" size={28} />
                          <h3 className="mb-1">{currentTheater.totalScreens}</h3>
                          <p className="text-muted mb-0">Screens</p>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xs={6}>
                      <Card className="text-center h-100 border-0 bg-light">
                        <Card.Body>
                          <Users className="mb-2 text-primary" size={28} />
                          <h3 className="mb-1">{stats?.totalShowsToday || 0}</h3>
                          <p className="text-muted mb-0">Shows Today</p>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Quick Stats */}
          <Row className="mb-4 g-3">
            <Col md={3}>
              <Card className="text-center h-100 shadow-sm">
                <Card.Body>
                  <h3 className="mb-1">{stats?.totalSeats || 0}</h3>
                  <p className="text-muted mb-0">Total Seats</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100 shadow-sm">
                <Card.Body>
                  <h3 className="mb-1">{stats?.availableSeats || 0}</h3>
                  <p className="text-muted mb-0">Available Seats</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100 shadow-sm">
                <Card.Body>
                  <h3 className="mb-1">{stats?.activeScreens || 0}</h3>
                  <p className="text-muted mb-0">Active Screens</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100 shadow-sm">
                <Card.Body>
                  <h3 className="mb-1">{`${(stats?.occupancyRate || 0).toFixed(1)}%`}</h3>
                  <p className="text-muted mb-0">Occupancy Rate</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Feature Cards */}
          <Row className="g-4">
            {features.map((feature, index) => (
              <Col key={index} md={4}>
                <Card 
                  className="h-100 shadow-sm border-0 hover-shadow cursor-pointer"
                  onClick={() => navigate(feature.link)}
                  style={{ cursor: 'pointer' }}
                >
                  <Card.Body>
                    <div 
                      className="d-flex align-items-center justify-content-center mb-3 rounded-circle"
                      style={{ 
                        width: '56px',
                        height: '56px',
                        backgroundColor: feature.bgColor
                      }}
                    >
                      <feature.icon size={28} className={`text-${feature.color}`} />
                    </div>
                    <Card.Title className="mb-3">{feature.title}</Card.Title>
                    <Card.Text className="text-muted">
                      {feature.description}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Edit Modal */}
          <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>Edit Theater Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={handleEditSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Theater Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        value={editForm.emailAddress}
                        onChange={(e) => setEditForm({...editForm, emailAddress: e.target.value})}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone Number</Form.Label>
                      <Form.Control
                        type="tel"
                        value={editForm.phoneNumber}
                        onChange={(e) => setEditForm({...editForm, phoneNumber: e.target.value})}
                        pattern="[0-9]{10}"
                        placeholder="Enter 10-digit phone number"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Amenities (comma-separated)</Form.Label>
                      <Form.Control
                        type="text"
                        value={editForm.amenities}
                        onChange={(e) => setEditForm({...editForm, amenities: e.target.value})}
                        placeholder="e.g., Parking, Food Court, Gaming Zone"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Address</Form.Label>
                      <Form.Control
                        type="text"
                        value={editForm.address}
                        onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                        placeholder="Street address"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>City</Form.Label>
                      <Form.Control
                        type="text"
                        value={editForm.city}
                        onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>State</Form.Label>
                      <Form.Control
                        type="text"
                        value={editForm.state}
                        onChange={(e) => setEditForm({...editForm, state: e.target.value})}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>ZIP Code</Form.Label>
                      <Form.Control
                        type="text"
                        value={editForm.zipCode}
                        onChange={(e) => setEditForm({...editForm, zipCode: e.target.value})}
                        pattern="[0-9]{6}"
                        placeholder="Enter 6-digit ZIP code"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit">
                    Save Changes
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>

          {/* Add Theater Button - Only show if manager has permission */}
          {user?.role === 'THEATER_MANAGER' && theaters?.length > 0 && (
            <div className="position-fixed bottom-0 end-0 m-4">
              <Button
                variant="primary"
                className="rounded-circle d-flex align-items-center justify-content-center shadow-lg"
                style={{ width: '60px', height: '60px' }}
                onClick={() => navigate(`/manager/theaters/add?managerId=${user.id}`)}
                title="Add New Theater"
              >
                <Building2 size={24} />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Toast Notifications */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="position-fixed bottom-0 end-0 p-3"
        style={{ zIndex: 11 }}
      >
        <Toast 
          show={showToast} 
          onClose={() => setShowToast(false)} 
          delay={3000} 
          autohide
          bg="light"
          className="shadow-lg"
        >
          <Toast.Header closeButton={false}>
            <strong className="me-auto">Notification</strong>
            <Button 
              variant="link" 
              className="p-0 ms-2 text-dark" 
              onClick={() => setShowToast(false)}
            >
              ×
            </Button>
          </Toast.Header>
          <Toast.Body>{toastMessage}</Toast.Body>
        </Toast>
      </div>
    </Container>
  );
};

export default TheaterManagerHome;