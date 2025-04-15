import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Badge, Spinner, Alert, Button, ProgressBar } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Edit,
  LogOut,
  Monitor,
  Calendar,
  BarChart4,
  Film,
  Users,
  MapPin,
  Mail,
  Phone,
  Tag,
  Ticket,
  TrendingUp,
  Clock,
  DollarSign,
  Calendar as CalendarIcon,
  Check,
  X,
  CreditCard,
  Popcorn,
  Sparkles
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
import { getShowsByTheater } from '../../../redux/slices/showSlice';
import { getShowAnalytics } from '../../../redux/slices/showSlice';
import './TheaterManagerHome.css';

const TheaterManagerHome = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  // Redux selectors
  const currentTheater = useSelector(selectCurrentTheater);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  const stats = useSelector(selectTheaterStats);
  
  // Local state
  const [isInitialized, setIsInitialized] = useState(false);
  const [userId, setUserId] = useState(null);
  const [todayShows, setTodayShows] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [upcomingShows, setUpcomingShows] = useState([]);

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
        .catch((error) => {
          console.error('Error fetching theaters:', error);
        });
    }
  }, [userId, dispatch]);

  // Fetch theater stats and shows when currentTheater is available
  useEffect(() => {
    if (currentTheater?.id) {
      dispatch(fetchTheaterStats(currentTheater.id));
      dispatch(fetchTheaterScreens(currentTheater.id));
      localStorage.setItem('theaterId', currentTheater.id);
      
      // Fetch all shows for this theater
      dispatch(getShowsByTheater(currentTheater.id))
        .unwrap()
        .then(shows => {
          // Filter for today's shows
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          const todayShowsList = shows.filter(show => {
            const showTime = new Date(show.showTime);
            return showTime >= today && showTime < tomorrow;
          });
          
          // Sort by showtime
          todayShowsList.sort((a, b) => new Date(a.showTime) - new Date(b.showTime));
          setTodayShows(todayShowsList);
          
          // Get upcoming shows for next 7 days
          const nextWeek = new Date(today);
          nextWeek.setDate(nextWeek.getDate() + 7);
          
          const upcomingShowsList = shows.filter(show => {
            const showTime = new Date(show.showTime);
            return showTime > tomorrow && showTime <= nextWeek;
          });
          
          // Take only first 5 upcoming shows
          setUpcomingShows(upcomingShowsList.slice(0, 5));
        })
        .catch(error => {
          console.error('Error fetching shows:', error);
        });
        
      // Fetch analytics
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // last 30 days
      
      const params = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        theaterId: currentTheater.id
      };
      
      dispatch(getShowAnalytics(params))
        .unwrap()
        .then(data => {
          setAnalytics(data);
        })
        .catch(error => {
          console.error('Error fetching analytics:', error);
        });
    }
  }, [currentTheater, dispatch]);

  // Refresh data on location change (navigation)
  useEffect(() => {
    if (userId && isInitialized) {
      dispatch(fetchManagerTheaters(userId));
    }
  }, [location.pathname, userId, isInitialized, dispatch]);

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    navigate('/login');
  };
    
  // Features configuration
  const features = [
    {
      title: 'Manage Screens',
      description: 'Design and configure theater screen layouts',
      icon: Monitor,
      link: `/manager/theaters/${currentTheater?.id}/screens`,
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)'
    },
    {
      title: 'Show Schedule',
      description: 'Manage movie show timings and pricing',
      icon: Calendar,
      link: `/manager/shows`,
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)'
    },
    {
      title: 'Analytics',
      description: 'View theater performance and revenue analytics',
      icon: BarChart4,
      link: `/manager/analytics`,
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)'
    }
  ];

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

  // Calculates occupancy rate properly
  const occupancyRate = stats?.totalSeats > 0 
    ? (((stats?.totalSeats - stats?.availableSeats) / stats?.totalSeats) * 100).toFixed(1) 
    : '0.0';
    
  // Format time for display
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date for display  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <Container fluid className="p-4">
      {/* Header Section with Theater Info */}
      <div className="bg-white rounded-4 shadow-sm p-4 mb-4 theater-card">
        <Row>
          <Col lg={8}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h2 className="fw-bold mb-0">{currentTheater.name}</h2>
                <p className="text-muted mt-1">
                  {currentTheater.description || "A premier movie destination offering the best cinematic experience."}
                </p>
              </div>
              <Badge bg={currentTheater.status === 'ACTIVE' ? 'success' : 'secondary'} 
                className="fs-6 py-2 px-3 rounded-pill">
                {currentTheater.status}
              </Badge>
            </div>
            
            <div className="d-flex flex-wrap gap-4 mb-4">
              <div className="d-flex align-items-center">
                <MapPin size={18} className="text-primary me-2" />
                <span className="text-secondary">{currentTheater.location?.address}, {currentTheater.location?.city}</span>
              </div>
              <div className="d-flex align-items-center">
                <Mail size={18} className="text-primary me-2" />
                <span className="text-secondary">{currentTheater.emailAddress}</span>
              </div>
              <div className="d-flex align-items-center">
                <Phone size={18} className="text-primary me-2" />
                <span className="text-secondary">{currentTheater.phoneNumber}</span>
              </div>
            </div>
            
            <div className="d-flex flex-wrap gap-2 mb-4">
              {currentTheater.amenities?.map((amenity, index) => (
                <span key={index} className="amenity-badge d-inline-flex align-items-center">
                  {amenity === 'Parking' && <MapPin size={14} className="me-1" />}
                  {amenity === 'Food Court' && <Popcorn size={14} className="me-1" />}
                  {amenity === 'IMAX' && <Film size={14} className="me-1" />}
                  {amenity}
                </span>
              ))}
            </div>
            
            {/* <div className="d-flex flex-wrap gap-3">
              <Button 
                variant="outline-primary" 
                className="d-flex align-items-center gap-2 px-4 py-2"
                onClick={() => navigate(`/manager/theater/edit`)}
              >
                <Edit size={18} />
                Edit Theater
              </Button>
              <Button 
                variant="outline-danger" 
                className="d-flex align-items-center gap-2 px-4 py-2"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                Logout
              </Button>
            </div> */}
          </Col>
          
          <Col lg={4} className="mt-4 mt-lg-0 d-flex flex-column justify-content-center">
            <Row className="g-3">
              <Col sm={6}>
                <Card className="text-center h-100 border-0 shadow-sm stats-card">
                  <Card.Body className="d-flex flex-column align-items-center justify-content-center p-4">
                    <div className="feature-icon bg-primary bg-opacity-10">
                      <Film className="text-primary" size={24} />
                    </div>
                    <h3 className="fw-bold mb-1">{currentTheater.totalScreens || 0}</h3>
                    <p className="text-muted mb-0">Screens</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col sm={6}>
                <Card className="text-center h-100 border-0 shadow-sm stats-card">
                  <Card.Body className="d-flex flex-column align-items-center justify-content-center p-4">
                    <div className="feature-icon bg-success bg-opacity-10">
                      <Ticket className="text-success" size={24} />
                    </div>
                    <h3 className="fw-bold mb-1">{todayShows.length}</h3>
                    <p className="text-muted mb-0">Shows Today</p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>

      <Row>
        {/* Left Column - Live Stats and Performance Data */}
        <Col lg={8}>
          {/* Live Theater Stats */}
          <Card className="border-0 shadow-sm mb-4 hover-shadow">
            <Card.Header className="bg-white border-0 pt-4 pb-1 px-4">
              <h4 className="fw-bold mb-0">Live Theater Performance</h4>
            </Card.Header>
            <Card.Body className="px-4 pb-4">
              <Row className="g-3">
                <Col md={6} xl={3}>
                  <div className="p-3 rounded-4 bg-light">
                    <div className="d-flex align-items-center mb-2">
                      <div className="feature-icon bg-primary bg-opacity-10" style={{width: '40px', height: '40px'}}>
                        <Users size={20} className="text-primary" />
                      </div>
                      <p className="ms-2 mb-0 text-muted">Total Capacity</p>
                    </div>
                    <h3 className="fw-bold mb-0">{stats?.totalSeats || 0}</h3>
                  </div>
                </Col>
                
                <Col md={6} xl={3}>
                  <div className="p-3 rounded-4 bg-light">
                    <div className="d-flex align-items-center mb-2">
                      <div className="feature-icon bg-success bg-opacity-10" style={{width: '40px', height: '40px'}}>
                        <Check size={20} className="text-success" />
                      </div>
                      <p className="ms-2 mb-0 text-muted">Available</p>
                    </div>
                    <h3 className="fw-bold mb-0">{stats?.availableSeats || 0}</h3>
                  </div>
                </Col>
                
                <Col md={6} xl={3}>
                  <div className="p-3 rounded-4 bg-light">
                    <div className="d-flex align-items-center mb-2">
                      <div className="feature-icon bg-danger bg-opacity-10" style={{width: '40px', height: '40px'}}>
                        <X size={20} className="text-danger" />
                      </div>
                      <p className="ms-2 mb-0 text-muted">Booked</p>
                    </div>
                    <h3 className="fw-bold mb-0">{stats?.totalSeats ? (stats.totalSeats - stats.availableSeats) : 0}</h3>
                  </div>
                </Col>
                
                <Col md={6} xl={3}>
                  <div className="p-3 rounded-4 bg-light">
                    <div className="d-flex align-items-center mb-2">
                      <div className="feature-icon bg-warning bg-opacity-10" style={{width: '40px', height: '40px'}}>
                        <TrendingUp size={20} className="text-warning" />
                      </div>
                      <p className="ms-2 mb-0 text-muted">Occupancy</p>
                    </div>
                    <h3 className="fw-bold mb-0">{occupancyRate}%</h3>
                  </div>
                </Col>
              </Row>
              
              <div className="mt-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <p className="mb-0 fw-medium">Current Occupancy</p>
                  <Badge bg={
                    parseFloat(occupancyRate) < 30 ? 'danger' : 
                    parseFloat(occupancyRate) < 60 ? 'warning' : 
                    'success'
                  } className="rounded-pill px-3">
                    {parseFloat(occupancyRate) < 30 ? 'Low' : 
                     parseFloat(occupancyRate) < 60 ? 'Medium' : 
                     'High'}
                  </Badge>
                </div>
                <ProgressBar 
                  now={parseFloat(occupancyRate)} 
                  variant={
                    parseFloat(occupancyRate) < 30 ? 'danger' : 
                    parseFloat(occupancyRate) < 60 ? 'warning' : 
                    'success'
                  }
                  className="rounded-pill"
                  style={{height: '10px'}}
                />
              </div>
              
              <div className="mt-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <p className="mb-0 fw-medium">Active Screens</p>
                  <span className="text-muted">{stats?.activeScreens || 0} of {currentTheater.totalScreens || 0}</span>
                </div>
                <ProgressBar 
                  now={(stats?.activeScreens / currentTheater.totalScreens) * 100 || 0} 
                  variant="info"
                  className="rounded-pill"
                  style={{height: '10px'}}
                />
              </div>
            </Card.Body>
          </Card>
          
          {/* Today's Shows */}
          <Card className="border-0 shadow-sm mb-4 hover-shadow">
            <Card.Header className="bg-white border-0 pt-4 pb-1 px-4">
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="fw-bold mb-0">Today's Shows</h4>
                <Badge bg="info" className="rounded-pill px-3 py-2">
                  {todayShows.length} Shows
                </Badge>
              </div>
            </Card.Header>
            <Card.Body className="px-4 pb-4">
              {todayShows.length === 0 ? (
                <div className="text-center py-5">
                  <Calendar size={48} className="text-muted mb-3" />
                  <p>No shows scheduled for today.</p>
                  <Button 
                    variant="outline-primary"
                    onClick={() => navigate(`/manager/shows`)}
                  >
                    Schedule a Show
                  </Button>
                </div>
              ) : (
                <>
                  {todayShows.map((show, index) => (
                    <div 
                      key={index} 
                      className={`p-3 ${index !== todayShows.length - 1 ? 'border-bottom' : ''}`}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <div className="bg-light text-center rounded-3 p-2 me-3" style={{minWidth: '60px'}}>
                            <div className="fw-bold">
                              {formatTime(show.showTime)}
                            </div>
                            <small className="text-muted">
                              Screen {show.screenNumber}
                            </small>
                          </div>
                          <div>
                            <h6 className="mb-1 fw-bold">{show.movieTitle || 'Movie Title'}</h6>
                            <div className="d-flex flex-wrap gap-2">
                              <Badge bg="light" text="dark" className="rounded-pill">
                                {show.language || 'Language'}
                              </Badge>
                              <Badge bg="light" text="dark" className="rounded-pill">
                                {show.experience || '2D'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="mb-1">
                            <Badge bg={
                              show.availableSeats === 0 ? 'danger' :
                              show.availableSeats < 10 ? 'warning' : 'success'
                            } className="rounded-pill px-3">
                              {show.availableSeats === 0 ? 'Sold Out' :
                               show.availableSeats < 10 ? 'Filling Fast' : 'Available'}
                            </Badge>
                          </div>
                          <small className="text-muted">
                            {show.availableSeats || 0}/{show.totalSeats || 0} seats available
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="text-center mt-3">
                    <Button 
                      variant="outline-primary"
                      size="sm"
                      onClick={() => navigate(`/manager/shows`)}
                    >
                      View All Shows
                    </Button>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        {/* Right Column - Quick Actions and Upcoming Shows */}
        <Col lg={4}>
          {/* Quick Actions */}
          {/* <Card className="border-0 shadow-sm mb-4 hover-shadow">
            <Card.Header className="bg-white border-0 pt-4 pb-1 px-4">
              <h4 className="fw-bold mb-0">Quick Actions</h4>
            </Card.Header>
            <Card.Body className="px-4 pb-4">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="cursor-pointer p-3 rounded-4 mb-3 hover-shadow"
                  style={{
                    backgroundColor: feature.bgColor,
                    border: `1px solid ${feature.color}20`,
                  }}
                  onClick={() => navigate(feature.link)}
                >
                  <div className="d-flex align-items-center">
                    <div className="feature-icon" style={{
                      backgroundColor: 'white',
                      width: '48px',
                      height: '48px',
                      marginRight: '1rem',
                      marginBottom: 0
                    }}>
                      <feature.icon size={24} color={feature.color} />
                    </div>
                    <div>
                      <h5 className="fw-bold mb-1" style={{color: feature.color}}>{feature.title}</h5>
                      <p className="text-muted mb-0 small">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </Card.Body>
          </Card> */}
          
          {/* Upcoming Shows */}
          <Card className="border-0 shadow-sm mb-4 hover-shadow">
            <Card.Header className="bg-white border-0 pt-4 pb-1 px-4">
              <h4 className="fw-bold mb-0">Upcoming Shows</h4>
            </Card.Header>
            <Card.Body className="px-4 pb-4">
              {upcomingShows.length === 0 ? (
                <div className="text-center py-4">
                  <CalendarIcon size={48} className="text-muted mb-3" />
                  <p>No upcoming shows scheduled.</p>
                </div>
              ) : (
                <>
                  {upcomingShows.map((show, index) => (
                    <div 
                      key={index} 
                      className={`p-3 ${index !== upcomingShows.length - 1 ? 'border-bottom' : ''}`}
                    >
                      <div className="d-flex">
                        <div className="bg-light text-center rounded-3 p-2 me-3" style={{minWidth: '45px'}}>
                          <small className="d-block text-uppercase fw-bold" style={{fontSize: '0.7rem'}}>
                            {new Date(show.showTime).toLocaleDateString([], {month: 'short'}).toUpperCase()}
                          </small>
                          <div className="fw-bold">
                            {new Date(show.showTime).getDate()}
                          </div>
                        </div>
                        <div>
                          <h6 className="mb-1 fw-bold">{show.movieTitle || 'Movie Title'}</h6>
                          <div className="d-flex align-items-center text-muted small mb-1">
                            <Clock size={14} className="me-1" />
                            {formatTime(show.showTime)} • Screen {show.screenNumber}
                          </div>
                          <div className="d-flex flex-wrap gap-2">
                            <Badge bg="light" text="dark" className="rounded-pill small">
                              {show.language || 'Language'}
                            </Badge>
                            <Badge bg="light" text="dark" className="rounded-pill small">
                              {show.experience || '2D'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="text-center mt-3">
                    <Button 
                      variant="outline-primary"
                      size="sm"
                      onClick={() => navigate(`/manager/shows`)}
                    >
                      Schedule New Show
                    </Button>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
          
          {/* Revenue Snapshot */}
          <Card className="border-0 shadow-sm hover-shadow">
            <Card.Header className="bg-white border-0 pt-4 pb-1 px-4">
              <h4 className="fw-bold mb-0">Revenue Snapshot</h4>
            </Card.Header>
            <Card.Body className="px-4 pb-4">
              <div className="d-flex align-items-center justify-content-center mb-4">
                <div className="text-center">
                  <div className="feature-icon mx-auto mb-3" style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    width: '64px',
                    height: '64px',
                  }}>
                    <DollarSign size={28} className="text-success" />
                  </div>
                  <h5 className="fw-bold mb-1">
                    ₹{analytics?.totalRevenue || '0'}
                  </h5>
                  <p className="text-muted mb-0">This Month's Revenue</p>
                </div>
              </div>
              
              <Row className="g-3 mb-3">
                <Col xs={6}>
                  <div className="p-3 rounded-4 bg-light text-center">
                    <div className="d-flex align-items-center justify-content-center mb-2">
                      <Ticket size={18} className="text-primary me-1" />
                      <p className="mb-0 text-muted small">Tickets Sold</p>
                    </div>
                    <h5 className="fw-bold mb-0">{analytics?.ticketsSold || '0'}</h5>
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="p-3 rounded-4 bg-light text-center">
                    <div className="d-flex align-items-center justify-content-center mb-2">
                      <CreditCard size={18} className="text-primary me-1" />
                      <p className="mb-0 text-muted small">Avg. Ticket</p>
                    </div>
                    <h5 className="fw-bold mb-0">
                      ₹{analytics?.ticketsSold > 0 ? (analytics.totalRevenue / analytics.ticketsSold).toFixed(0) : '0'}
                    </h5>
                  </div>
                </Col>
              </Row>
              
              <Button 
                variant="outline-success"
                className="w-100 d-flex align-items-center justify-content-center"
                onClick={() => navigate(`/manager/analytics`)}
              >
                <BarChart4 size={18} className="me-2" />
                View Detailed Analytics
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default TheaterManagerHome;