// src/layouts/TheaterManagerLayout.js
import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Building, Film, Clock, BarChart2, LogOut } from 'lucide-react';

const TheaterManagerLayout = () => {
  const location = useLocation();

  return (
    <div className="theater-manager-container">
      <Navbar bg="white" expand="lg" className="mb-4 shadow-sm">
        <Container fluid>
          <Navbar.Brand as={Link} to="/manager">
            MovieBuff Manager
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="manager-navbar" />
          <Navbar.Collapse id="manager-navbar">
            <Nav className="me-auto">
              <Nav.Link 
                as={Link} 
                to="/manager/theaters"
                active={location.pathname.includes('/theaters')}
              >
                <Building size={18} className="me-2" />
                Theaters
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                to="/manager/screen-setup"
                active={location.pathname.includes('/screen-setup')}
              >
                <Film size={18} className="me-2" />
                Screens
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                to="/manager/schedule"
                active={location.pathname.includes('/schedule')}
              >
                <Clock size={18} className="me-2" />
                Shows
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                to="/manager/analytics"
                active={location.pathname.includes('/analytics')}
              >
                <BarChart2 size={18} className="me-2" />
                Analytics
              </Nav.Link>
            </Nav>
            <Button variant="outline-danger" className="d-flex align-items-center gap-2">
              <LogOut size={18} />
              Logout
            </Button>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Outlet />
    </div>
  );
};

export default TheaterManagerLayout;