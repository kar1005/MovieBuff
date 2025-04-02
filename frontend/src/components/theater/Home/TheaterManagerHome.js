import { Container, Row, Col, Card, Badge, Spinner, Alert,Button  } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  Edit3, 
  LogOut,
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
  fetchManagerTheaters,
  fetchTheaterStats,
  selectCurrentTheater,
  selectTheaterStats,
  selectLoading,
  selectError,
  fetchTheaterScreens
} from '../../../redux/slices/theaterSlice';

const TheaterManagerHome = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  // Redux selectors
  const currentTheater = useSelector(selectCurrentTheater);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  
  // Local state
  const [isInitialized, setIsInitialized] = useState(false);
  const [userId, setUserId] = useState(null);



    // Fetch theater stats when currentTheater is available
    useEffect(() => {
      if (currentTheater && currentTheater.id) {
        dispatch(fetchTheaterStats(currentTheater.id));
        dispatch(fetchTheaterScreens(currentTheater.id));    
        localStorage.setItem('theaterId', currentTheater.id);
        
      }
    }, [currentTheater, dispatch]);
  
    const stats = useSelector(selectTheaterStats);

    const handleLogout = () => {
      // Clear local storage
      localStorage.removeItem('userId');
      localStorage.removeItem('token');
      navigate('/login');
    };
    
  // Features configuration
  const features = [
    {
      title: 'Manage Screens',
      description: 'Design and configure theater screen layouts',
      icon: MonitorPlay,
      link: `/manager/theaters/${currentTheater?.id}/screens`,
      color: 'success'
    },
    {
      title: 'Show Schedule',
      description: 'Manage movie show timings and pricing',
      icon: Calendar,
      link: `/manager/shows`,
      color: 'info'
    },
    {
      title: 'Analytics',
      description: 'View theater performance and revenue analytics',
      icon: BarChart3,
      link: `/manager/analytics`,
      color: 'warning'
    }
  ];
  // console.log("stats : "+ JSON.stringify(stats));

  // Initialize user data and fetch theaters
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');

    if (storedUserId && !isInitialized) {
      setUserId(storedUserId);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Fetch theaters when userId is available
  useEffect(() => {
    if (userId) {
      dispatch(fetchManagerTheaters(userId))
        .unwrap()
        .then((theaters) => {
          if (theaters && theaters.length > 0 && theaters[0].id) {
            dispatch(fetchTheaterStats(theaters.id));
          }
        })
        .catch((error) => {
          console.error('Error fetching theaters:', error);
        });


    }
  }, [userId, dispatch]);

  // Refresh data on location change (navigation)
  useEffect(() => {
    if (userId && isInitialized) {
      dispatch(fetchManagerTheaters(userId));
    }
  }, [location.pathname]);

  // Loading state
  if (loading && !currentTheater) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container className="p-4">
        <Alert variant="danger">
          Error loading theater details: {error}
        </Alert>
      </Container>
    );
  }

  // No theater found state
  if (!currentTheater) {
    return (
      <Container className="p-4">
        <Alert variant="info">
          No theater found. Please add a theater to get started.
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="p-4">
      {/* Theater Overview Card */}
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
        <div className="d-flex gap-2 mb-3">
          {currentTheater.amenities?.map((amenity, index) => (
            <Badge key={index} bg="secondary">{amenity}</Badge>
          ))}
        </div>
        <div className="d-flex justify-content-start gap-2">
          <Button 
            variant="outline-primary" 
            className="d-flex align-items-center gap-2"
            onClick={() => navigate(`/manager/theater/edit`)}
          >
            <Edit3 size={18} />
            Edit Theater
          </Button>
          <Button 
            variant="outline-danger" 
            className="d-flex align-items-center gap-2"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            Logout
          </Button>
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
    </Container>
  );
};

export default TheaterManagerHome;