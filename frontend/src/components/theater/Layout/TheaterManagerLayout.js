// src/components/theater/Layout/TheaterManagerLayout.js
import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Nav, Navbar, Button, Badge } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../../redux/slices/authSlice';
import { 
  fetchManagerTheaters, 
  fetchTheaterStats 
} from '../../../redux/slices/theaterSlice';
import { checkSubscriptionStatus } from '../../../redux/slices/subscriptionSlice';
import { 
  LayoutDashboard, 
  Settings, 
  Film, 
  BarChart3, 
  CalendarDays, 
  LogOut, 
  Wallet,
  Menu,
  X,
  Theater,
  AlertCircle,
  User,
  Bell
} from 'lucide-react';
import './TheaterManagerLayout.css';
import logo from '../../../images/Logo/Logo.png';

const TheaterManagerLayout = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { currentTheater } = useSelector((state) => state.theater);
  const { isSubscriptionActive } = useSelector((state) => state.subscription);
  const [showSidebar, setShowSidebar] = useState(true);

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

  // Redirect to subscription page if subscription is not active
  useEffect(() => {
    if (isAuthenticated && user?.role === 'THEATER_MANAGER' && isSubscriptionActive === false) {
      // Skip redirect if already on subscription page
      if (!location.pathname.includes('/subscription')) {
        navigate('/manager/subscription');
      }
    }
  }, [isSubscriptionActive, isAuthenticated, user, navigate, location]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/manager' },
    { id: 'theater-settings', label: 'Theater Settings', icon: Settings, path: '/manager/theater/edit' },
    { id: 'manage-screens', label: 'Manage Screens', icon: Theater, path: '/manager/theaters/:theaterId/screens' },
    { id: 'show-schedule', label: 'Show Schedule', icon: CalendarDays, path: '/manager/shows' },
    { id: 'subscription', label: 'Subscription', icon: Wallet, path: '/manager/subscription/status' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/manager/analytics' },
  ];

  const isActive = (path) => {
    // Special case for dashboard which should only be active when exactly at /manager
    if (path === '/manager') {
      return location.pathname === '/manager';
    }
    // For other paths, check if the current path starts with the menu item path
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path) => {
    // Replace :theaterId with actual theater ID if present
    if (path.includes(':theaterId') && currentTheater) {
      path = path.replace(':theaterId', currentTheater.id);
    }
    navigate(path);
    if (window.innerWidth < 992) {
      setShowSidebar(false);
    }
  };

  // Status badge styling
  const getStatusBadgeVariant = (status) => {
    if (!status) return 'secondary';
    
    switch(status.toUpperCase()) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="theater-manager-layout d-flex flex-column">
      {/* Top Navbar */}
      <Navbar bg="dark" variant="dark" className="border-bottom shadow-sm navbar-custom">
        <Container fluid className="px-3">
          <div className="d-flex align-items-center">
            <button 
              className="btn btn-link text-white p-0 d-lg-none me-3"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              {showSidebar ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Navbar.Brand className="d-flex align-items-center m-0">
              <img
                src={logo}
                alt="MovieBuff Logo"
                className="d-inline-block align-middle"
                height="36"
              />
              <span className="ms-2 fw-semibold fs-5">Theater Manager</span>
            </Navbar.Brand>
          </div>
          
          <div className="d-flex align-items-center navbar-right">
            {/* Subscription Status */}
            {!isSubscriptionActive && (
              <Link to="/manager/subscription" className="me-3 text-decoration-none">
                <Button size="sm" variant="warning" className="d-flex align-items-center py-1 px-3">
                  <AlertCircle size={16} className="me-1" />
                  <span>Subscribe</span>
                </Button>
              </Link>
            )}
          </div>
        </Container>
      </Navbar>

      {/* Subscription Warning Banner */}
      {!isSubscriptionActive && location.pathname !== '/manager/subscription' && (
        <div className="subscription-alert-banner">
          <AlertCircle size={16} className="me-2" />
          <span>Your subscription is inactive. Some features may be limited.</span>
          <Link to="/manager/subscription" className="ms-3">
            <Button size="sm" variant="light">Renew Now</Button>
          </Link>
        </div>
      )}

      <Container fluid className="flex-grow-1 px-0">
        <Row className="g-0 h-100">
          {/* Sidebar */}
          <Col 
            lg={2} 
            className={`sidebar bg-dark ${showSidebar ? 'd-block' : 'd-none'} d-lg-block`}
          >
            {/* Theater Info */}
            {currentTheater && (
              <div className="theater-info p-3 mb-2 border-bottom border-secondary">
                <h6 className="text-light mb-1">Your Theater</h6>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="text-light fw-bold theater-name">{currentTheater.name}</div>
                  <Badge bg={getStatusBadgeVariant(currentTheater.status)} className="text-uppercase">
                    {currentTheater.status}
                  </Badge>
                </div>
              </div>
            )}
            
            {/* Navigation Menu */}
            <Nav className="flex-column py-2">
              {menuItems.map((item) => (
                <Nav.Link 
                  key={item.id}
                  className={`nav-link-custom d-flex align-items-center px-3 py-2 my-1 mx-2 rounded ${
                    isActive(item.path) ? 'active' : ''
                  }`}
                  onClick={() => handleNavigation(item.path)}
                >
                  <item.icon size={18} className="me-3" strokeWidth={2} />
                  <span className="menu-text">{item.label}</span>
                </Nav.Link>
              ))}
              
              {/* Logout Button */}
              <Nav.Link 
                className="nav-link-custom d-flex align-items-center px-3 py-2 my-1 mx-2 rounded text-danger mt-auto"
                onClick={handleLogout}
              >
                <LogOut size={18} className="me-3" strokeWidth={2} />
                <span className="menu-text">Logout</span>
              </Nav.Link>
            </Nav>
          </Col>

          {/* Main Content */}
          <Col lg={showSidebar ? 10 : 12} className="main-content p-4 bg-light">
            {children}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default TheaterManagerLayout;