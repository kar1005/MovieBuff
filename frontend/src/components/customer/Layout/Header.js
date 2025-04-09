// src/components/customer/Layout/Header.js
import React, { useState, useEffect } from 'react';
import { Container, Navbar, Nav, NavDropdown, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../../redux/slices/authSlice';
import { Film, User, Calendar, Clock, Ticket, LogOut } from 'lucide-react';
import './Header.css';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Handle scroll event to make header disappear when scrolling down
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className={`customer-header ${scrolled ? 'scrolled' : ''}`}>
      <Navbar expand="lg" variant="dark" className="py-2">
        <Container fluid>
          <Navbar.Brand as={Link} to="/customer" className="d-flex align-items-center">
            <Film className="me-2" size={24} />
            <span className="fw-bold brand-text">MovieBuff</span>
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="navbar-nav" />
          
          <Navbar.Collapse id="navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/customer/movies">Movies</Nav.Link>
              <Nav.Link as={Link} to="/customer/theaters">Theaters</Nav.Link>
              <Nav.Link as={Link} to="/customer/upcoming">Upcoming</Nav.Link>
              <Nav.Link as={Link} to="/customer/offers">Offers</Nav.Link>
            </Nav>
            
            {isAuthenticated ? (
              <Nav>
                <Nav.Link as={Link} to="/customer/booking/history" className="mx-2">
                  <Ticket size={18} className="me-1" />
                  My Bookings
                </Nav.Link>
                
                <NavDropdown 
                  title={
                    <div className="d-inline-flex align-items-center">
                      <User size={18} className="me-1" />
                      {user?.username || 'Account'}
                    </div>
                  } 
                  id="user-dropdown"
                  align="end"
                >
                  <NavDropdown.Item as={Link} to="/customer/profile">
                    <User size={16} className="me-2" />
                    Profile
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/customer/booking/history">
                    <Clock size={16} className="me-2" />
                    Booking History
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    <LogOut size={16} className="me-2" />
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </Nav>
            ) : (
              <Nav>
                <Button 
                  as={Link} 
                  to="/login" 
                  variant="outline-light" 
                  className="me-2"
                >
                  Login
                </Button>
                <Button 
                  as={Link} 
                  to="/register" 
                  variant="warning"
                >
                  Sign Up
                </Button>
              </Nav>
            )}
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
};

export default Header;