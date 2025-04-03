// src/components/theater/Layout/TheaterManagerLayout.js
import React, { useEffect, useState } from 'react';
import { Container, Nav, Navbar, Button, Offcanvas } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../../redux/slices/authSlice';
import { 
  fetchManagerTheaters, 
  fetchTheaterStats 
} from '../../../redux/slices/theaterSlice';
import { checkSubscriptionStatus } from '../../../redux/slices/subscriptionSlice';
import { 
  Drama, 
  Home, 
  Film, 
  ChartBar, 
  Cog, 
  CalendarDays, 
  LogOut, 
  Wallet
} from 'lucide-react';

const TheaterManagerLayout = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { currentTheater } = useSelector((state) => state.theater);
  const { isSubscriptionActive } = useSelector((state) => state.subscription);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user?.role !== 'THEATER_MANAGER') {
      // Redirect to appropriate page if not a theater manager
      navigate('/');
    } else {
      // Fetch theater details
      dispatch(fetchManagerTheaters(user.id));
      
      // Check subscription status
      dispatch(checkSubscriptionStatus(user.id));
    }
  }, [isAuthenticated, user, dispatch, navigate]);

  useEffect(() => {
    // Fetch theater stats when current theater changes
    if (currentTheater) {
      dispatch(fetchTheaterStats(currentTheater.id));
    }
  }, [currentTheater, dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Handler to toggle sidebar on mobile
  const toggleSidebar = () => setShowSidebar(!showSidebar);

  // Check if path is active
  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  // Redirect to subscription page if subscription is not active
  useEffect(() => {
    if (isAuthenticated && user?.role === 'THEATER_MANAGER' && isSubscriptionActive === false) {
      // Skip redirect if already on subscription page
      if (!location.pathname.includes('/subscription')) {
        navigate('/manager/subscription');
      }
    }
  }, [isSubscriptionActive, isAuthenticated, user, navigate, location]);

  return (
    <div className="theater-manager-layout d-flex">
      {/* Sidebar for larger screens */}
      <div className="sidebar d-none d-lg-flex flex-column flex-shrink-0 p-3 bg-dark" style={{ width: '280px', minHeight: '100vh' }}>
        <div className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
          <Drama size={24} className="me-2" />
          <span className="fs-4">Manager Portal</span>
        </div>
        <hr className="text-white" />
        
        {currentTheater && (
          <div className="text-center mb-3">
            <h5 className="text-white">{currentTheater.name}</h5>
            <span className="badge bg-primary">{currentTheater.status}</span>
          </div>
        )}
        
        <Nav className="flex-column mb-auto">
          <Nav.Item>
            <Nav.Link 
              as={Link} 
              to="/manager" 
              className={`text-white ${isActive('/manager') && !isActive('/manager/') ? 'active' : ''}`}
            >
              <Home className="me-2" /> Dashboard
            </Nav.Link>
          </Nav.Item>
          
          <Nav.Item>
            <Nav.Link 
              as={Link} 
              to="/manager/theater/edit" 
              className={`text-white ${isActive('/manager/theater/edit') ? 'active' : ''}`}
            >
              <Cog className="me-2" /> Theater Settings
            </Nav.Link>
          </Nav.Item>
          
          <Nav.Item>
            <Nav.Link 
              as={Link} 
              to="/manager/theaters/:theaterId/screens" 
              className={`text-white ${isActive('/manager/theaters') && isActive('/screens') ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                if (currentTheater) {
                  navigate(`/manager/theaters/${currentTheater.id}/screens`);
                }
              }}
            >
              <Drama className="me-2" /> Screen Management
            </Nav.Link>
          </Nav.Item>
          
          <Nav.Item>
            <Nav.Link 
              as={Link} 
              to="/manager/shows/manage" 
              className={`text-white ${isActive('/manager/shows/manage') ? 'active' : ''}`}
            >
              <Film className="me-2" /> Show Management
            </Nav.Link>
          </Nav.Item>
          
          <Nav.Item>
            <Nav.Link 
              as={Link} 
              to="/manager/shows/schedule" 
              className={`text-white ${isActive('/manager/shows/schedule') ? 'active' : ''}`}
            >
              <CalendarDays className="me-2" /> Schedule Shows
            </Nav.Link>
          </Nav.Item>
          
          <Nav.Item>
            <Nav.Link 
              as={Link} 
              to="/manager/analytics" 
              className={`text-white ${isActive('/manager/analytics') ? 'active' : ''}`}
            >
              <ChartBar className="me-2" /> Analytics
            </Nav.Link>
          </Nav.Item>
          
          <Nav.Item>
            <Nav.Link 
              as={Link} 
              to="/manager/subscription/status" 
              className={`text-white ${isActive('/manager/subscription') ? 'active' : ''}`}
            >
              <Wallet className="me-2" /> Subscription
            </Nav.Link>
          </Nav.Item>
        </Nav>
        
        <hr className="text-white" />
        <Button variant="outline-light" onClick={handleLogout}>
          <LogOut className="me-2" /> Logout
        </Button>
      </div>

      {/* Mobile sidebar toggle and header */}
      <div className="d-flex flex-column flex-grow-1">
        <Navbar bg="dark" variant="dark" expand={false} className="d-lg-none mb-3">
          <Container fluid>
            <Button 
              variant="outline-light" 
              onClick={toggleSidebar}
              className="me-2"
            >
              <span className="navbar-toggler-icon"></span>
            </Button>
            <Navbar.Brand as={Link} to="/manager">Theater Manager</Navbar.Brand>
            
            {!isSubscriptionActive && (
              <Link to="/manager/subscription" className="ms-auto me-2">
                <Button variant="warning" size="sm">Subscribe Now</Button>
              </Link>
            )}
            
            <Button 
              variant="outline-light" 
              size="sm" 
              onClick={handleLogout}
              className="d-flex align-items-center"
            >
              <LogOut />
            </Button>
          </Container>
        </Navbar>
        
        {/* Mobile sidebar */}
        <Offcanvas show={showSidebar} onHide={toggleSidebar} className="bg-dark text-white">
          <Offcanvas.Header closeButton closeVariant="white">
            <Offcanvas.Title className="d-flex align-items-center">
              <Drama size={24} className="me-2" />
              <span>Manager Portal</span>
            </Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            {currentTheater && (
              <div className="text-center mb-3">
                <h5>{currentTheater.name}</h5>
                <span className="badge bg-primary">{currentTheater.status}</span>
              </div>
            )}
            
            <Nav className="flex-column mb-auto">
              <Nav.Item>
                <Nav.Link 
                  as={Link} 
                  to="/manager" 
                  className={`text-white ${isActive('/manager') && !isActive('/manager/') ? 'active' : ''}`}
                  onClick={toggleSidebar}
                >
                  <Home className="me-2" /> Dashboard
                </Nav.Link>
              </Nav.Item>
              
              <Nav.Item>
                <Nav.Link 
                  as={Link} 
                  to="/manager/theater/edit" 
                  className={`text-white ${isActive('/manager/theater/edit') ? 'active' : ''}`}
                  onClick={toggleSidebar}
                >
                  <Cog className="me-2" /> Theater Settings
                </Nav.Link>
              </Nav.Item>
              
              <Nav.Item>
                <Nav.Link 
                  as={Link} 
                  to="/manager/theaters/:theaterId/screens" 
                  className={`text-white ${isActive('/manager/theaters') && isActive('/screens') ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleSidebar();
                    if (currentTheater) {
                      navigate(`/manager/theaters/${currentTheater.id}/screens`);
                    }
                  }}
                >
                  <Drama className="me-2" /> Screen Management
                </Nav.Link>
              </Nav.Item>
              
              <Nav.Item>
                <Nav.Link 
                  as={Link} 
                  to="/manager/shows" 
                  className={`text-white ${isActive('/manager/shows') ? 'active' : ''}`}
                  onClick={toggleSidebar}
                >
                  <Film className="me-2" /> Show Management
                </Nav.Link>
              </Nav.Item>
              
              <Nav.Item>
                <Nav.Link 
                  as={Link} 
                  to="/manager/shows/schedule" 
                  className={`text-white ${isActive('/manager/shows/schedule') ? 'active' : ''}`}
                  onClick={toggleSidebar}
                >
                  <CalendarDays className="me-2" /> Schedule Shows
                </Nav.Link>
              </Nav.Item>
              
              <Nav.Item>
                <Nav.Link 
                  as={Link} 
                  to="/manager/analytics" 
                  className={`text-white ${isActive('/manager/analytics') ? 'active' : ''}`}
                  onClick={toggleSidebar}
                >
                  <ChartBar className="me-2" /> Analytics
                </Nav.Link>
              </Nav.Item>
              
              <Nav.Item>
                <Nav.Link 
                  as={Link} 
                  to="/manager/subscription/status" 
                  className={`text-white ${isActive('/manager/subscription') ? 'active' : ''}`}
                  onClick={toggleSidebar}
                >
                  <Wallet className="me-2" /> Subscription
                </Nav.Link>
              </Nav.Item>
            </Nav>
            
            <hr className="text-white" />
            <Button variant="outline-light" onClick={() => {
              toggleSidebar();
              handleLogout();
            }}>
              <LogOut className="me-2" /> Logout
            </Button>
          </Offcanvas.Body>
        </Offcanvas>

        {/* Main content */}
        <Container fluid className="main-content py-3">
          {!isSubscriptionActive && location.pathname !== '/manager/subscription' && (
            <div className="alert alert-warning mb-4">
              <strong>Subscription Required:</strong> Your subscription is inactive or has expired. 
              <Link to="/manager/subscription" className="ms-2">
                <Button variant="warning" size="sm">Subscribe Now</Button>
              </Link>
            </div>
          )}
          
          {children}
        </Container>
      </div>
    </div>
  );
};

export default TheaterManagerLayout;