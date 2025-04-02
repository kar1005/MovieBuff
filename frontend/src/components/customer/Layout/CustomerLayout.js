// src/components/customer/Layout/CustomerLayout.js
import React, { useState, useEffect } from 'react';
import { Container, Navbar, Nav, NavDropdown, Form, Button, InputGroup, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../../redux/slices/authSlice';
import { User, TicketAlt, History, LogOut, Search } from 'lucide-react';

const CustomerLayout = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/customer/movies?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="customer-layout">
      <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
        <Container>
          <Navbar.Brand as={Link} to="/customer/dashboard">MovieBuff</Navbar.Brand>
          <Navbar.Toggle aria-controls="customer-navbar-nav" />
          <Navbar.Collapse id="customer-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/customer/movies">Movies</Nav.Link>
              <Nav.Link as={Link} to="/customer/theaters">Theaters</Nav.Link>
              <NavDropdown title="Categories" id="categories-dropdown">
                <NavDropdown.Item as={Link} to="/customer/movies?genre=Action">Action</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/customer/movies?genre=Comedy">Comedy</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/customer/movies?genre=Drama">Drama</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/customer/movies?genre=Thriller">Thriller</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item as={Link} to="/customer/movies">All Genres</NavDropdown.Item>
              </NavDropdown>
            </Nav>
            
            <Form className="d-flex mx-auto" onSubmit={handleSearch}>
              <InputGroup>
                <Form.Control
                  type="search"
                  placeholder="Search movies, theaters..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search"
                />
                <Button variant="outline-light" type="submit">
                  <Search />
                </Button>
              </InputGroup>
            </Form>
            
            <Nav>
              {isAuthenticated ? (
                <NavDropdown 
                  title={
                    <span>
                      <User className="me-1" />
                      {user?.username || 'Profile'}
                    </span>
                  } 
                  id="user-dropdown"
                  align="end"
                >
                  <NavDropdown.Item as={Link} to="/customer/profile">My Profile</NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/customer/booking/history">
                    <History className="me-1" /> Booking History
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    <LogOut className="me-1" /> Logout
                  </NavDropdown.Item>
                </NavDropdown>
              ) : (
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main className="py-4">
        <Container>
          {children}
        </Container>
      </main>

      <footer className="bg-dark text-light py-4 mt-5">
        <Container>
          <div className="row">
            <div className="col-md-4">
              <h5>MovieBuff</h5>
              <p>Your ultimate movie booking destination.</p>
            </div>
            <div className="col-md-4">
              <h5>Quick Links</h5>
              <ul className="list-unstyled">
                <li><Link to="/customer/movies" className="text-light">Movies</Link></li>
                <li><Link to="/customer/theaters" className="text-light">Theaters</Link></li>
                <li><Link to="/customer/booking/history" className="text-light">Booking History</Link></li>
              </ul>
            </div>
            <div className="col-md-4">
              <h5>Contact Us</h5>
              <p>Email: support@moviebuff.com</p>
              <p>Phone: +1 (555) 123-4567</p>
            </div>
          </div>
          <div className="row mt-3">
            <div className="col-12 text-center">
              <p className="mb-0">&copy; {new Date().getFullYear()} MovieBuff. All rights reserved.</p>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default CustomerLayout;