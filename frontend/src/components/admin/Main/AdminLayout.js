// src/components/admin/layout/AdminLayout.jsx
import React, { useState } from 'react';
import { Container, Row, Col, Nav, Navbar } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  House, 
  Film, 
  Users, 
  Star, 
  Building2, 
  UserPlus2,
  ChartLine,
  Menu,
  Images,
  CalendarPlus2,
  X
} from 'lucide-react';
import './AdminLayout.css';
import logo from './MovieBuff_Logo.png';

const AdminLayout = ({ children }) => {
  const [showSidebar, setShowSidebar] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: House, path: '/admin/dashboard' },
    { id: 'movies', label: 'Movies', icon: Film, path: '/admin/movies' },
    { id: 'actors', label: 'Actors', icon: Users, path: '/admin/actors' },
    { id: 'customers', label: 'Customers', icon: UserPlus2, path: '/admin/customers' },
    { id: 'reviews', label: 'Reviews', icon: Star, path: '/admin/reviews' },
    { id: 'theater-managers', label: 'Theater Managers', icon: Building2, path: '/admin/theater-managers' },
    { id: 'stats', label: 'Statistics', icon: ChartLine , path: '/admin/stats' },
    { id: 'subscription', label: 'Subscription', icon: CalendarPlus2 , path: '/admin/subscription' },
    { id: 'subscription', label: 'Slider', icon: Images , path: '/admin/slider' },

  ];

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (window.innerWidth < 992) {
      setShowSidebar(false);
    }
  };

  return (
    <div className="admin-layout d-flex flex-column">
      {/* Top Navbar */}
      <Navbar bg="dark" variant="dark" className="border-bottom shadow-sm">
        <Container fluid className="px-3">
          <div className="d-flex align-items-center">
            <button 
              className="btn btn-link text-white p-0 d-lg-none me-2"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              {showSidebar ? <X size={22} /> : <Menu size={22} />}
            </button>
            <Navbar.Brand className="d-flex align-items-center m-0">
              <img
                src={logo}
                alt="MovieBuff Logo"
                className="d-inline-block align-middle"
              />
              <span className="ms-2 fw-semibold">MovieBuff Admin</span>
            </Navbar.Brand>
          </div>
        </Container>
      </Navbar>

      <Container fluid className="flex-grow-1 px-0">
        <Row className="g-0 h-100">
          {/* Sidebar */}
          <Col 
            lg={2} 
            className={`sidebar bg-dark ${showSidebar ? 'd-block' : 'd-none'} d-lg-block`}
          >
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

export default AdminLayout;