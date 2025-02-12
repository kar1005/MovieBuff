// src/components/theater/TheaterManagerHome.js
import { Container, Row, Col, Card, Badge, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import React, { useEffect } from 'react';

import { 
  Building2, 
  MonitorPlay, 
  Calendar, 
  BarChart3, 
  Film, 
  Users,
  MapPin,
  Mail,
  Phone
} from 'lucide-react';
import { 
  fetchTheaterById,  // Changed from fetchTheaterDetails
  fetchTheaterStats,
  selectCurrentTheater,  // Add selector
  selectTheaterStats,   // Add selector
  selectLoading,        // Add selector
  selectError          // Add selector
} from '../../redux/slices/theaterSlice';

// Then update the useSelector calls in the component:
const TheaterManagerHome = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentTheater = useSelector(selectCurrentTheater);  // Updated
  const stats = useSelector(selectTheaterStats);            // Updated
  const loading = useSelector(selectLoading);               // Updated
  const error = useSelector(selectError);                   // Updated

  // Hardcoded ID for now - will be replaced with logged-in user's theater ID
  const THEATER_ID = '67a87fdf756ca110272a627f';

  useEffect(() => {
    dispatch(fetchTheaterById(THEATER_ID));  // Changed from fetchTheaterDetails
    dispatch(fetchTheaterStats(THEATER_ID));
  }, [dispatch]);




  const features = [
    {
      title: 'Manage Screens',
      description: 'Design and configure theater screen layouts',
      icon: MonitorPlay,
      link: `/manager/theaters/${THEATER_ID}/screens`,
      color: 'success'
    },
    {
      title: 'Show Schedule',
      description: 'Manage movie show timings and pricing',
      icon: Calendar,
      link: '/manager/shows',
      color: 'info'
    },
    {
      title: 'Analytics',
      description: 'View theater performance and revenue analytics',
      icon: BarChart3,
      link: '/manager/analytics',
      color: 'warning'
    }
  ];

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="p-4">
        <Alert variant="danger">
          Error loading theater details: {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="p-4">
      {currentTheater && (
        <>
          {/* Theater Overview Card */}
          <Card className="mb-4">
            <Card.Body>
              <Row>
                <Col md={8}>
                  <h2>{currentTheater.name}</h2>
                  <p className="text-muted mb-3">{currentTheater.description}</p>
                  <div className="d-flex gap-3 mb-3">
                    <div className="d-flex align-items-center">
                      <MapPin size={18} className="me-2 text-primary" />
                      <span>{`${currentTheater.location.address}, ${currentTheater.location.city}`}</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <Mail size={18} className="me-2 text-primary" />
                      <span>{currentTheater.emailAddress}</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <Phone size={18} className="me-2 text-primary" />
                      <span>{currentTheater.phoneNumber}</span>
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    {currentTheater.amenities?.map((amenity, index) => (
                      <Badge key={index} bg="secondary">{amenity}</Badge>
                    ))}
                  </div>
                </Col>
                <Col md={4}>
                  <Row>
                    <Col xs={6}>
                      <Card className="text-center h-100">
                        <Card.Body>
                          <Film className="mb-2" size={24} />
                          <h3>{currentTheater.totalScreens}</h3>
                          <p className="mb-0">Screens</p>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xs={6}>
                      <Card className="text-center h-100">
                        <Card.Body>
                          <Users className="mb-2" size={24} />
                          <h3>{stats?.totalShowsToday || 0}</h3>
                          <p className="mb-0">Shows Today</p>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Quick Stats */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h3>{stats?.totalSeats || 0}</h3>
                  <p className="mb-0">Total Seats</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h3>{stats?.availableSeats || 0}</h3>
                  <p className="mb-0">Available Seats</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h3>{stats?.activeScreens || 0}</h3>
                  <p className="mb-0">Active Screens</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h3>{`${(stats?.occupancyRate || 0).toFixed(1)}%`}</h3>
                  <p className="mb-0">Occupancy Rate</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Feature Cards */}
          <Row>
            {features.map((feature, index) => (
              <Col key={index} md={4} className="mb-4">
                <Card 
                  className="h-100 cursor-pointer"
                  onClick={() => navigate(feature.link)}
                  style={{ cursor: 'pointer' }}
                >
                  <Card.Body>
                    <div 
                      className={`d-flex align-items-center justify-content-center mb-3`}
                      style={{ 
                        width: '48px',
                        height: '48px',
                        borderRadius: '8px',
                        backgroundColor: `var(--bs-${feature.color})`,
                        color: 'white'
                      }}
                    >
                      <feature.icon size={24} />
                    </div>
                    <Card.Title>{feature.title}</Card.Title>
                    <Card.Text className="text-muted">
                      {feature.description}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </>
      )}
    </Container>
  );
};

export default TheaterManagerHome;