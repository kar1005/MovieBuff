import React from 'react'
import { Container, Navbar, Nav, NavDropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function Header() {
  return (
    <div>
      <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
            <Container>
              <Navbar.Brand href="/">MovieBuff</Navbar.Brand>
              <Navbar.Toggle aria-controls="basic-navbar-nav" />
              <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="me-auto">
                <Nav.Link as={Link} to="/">Home</Nav.Link>
                  {/* <NavDropdown title="Theater Manager" id="manager-nav-dropdown">
                    <NavDropdown.Item href="/manager/theaters">Theaters</NavDropdown.Item>
                    <NavDropdown.Item href="/manager/screen-setup">Screen Setup</NavDropdown.Item>
                    <NavDropdown.Item href="/manager/shows">Shows</NavDropdown.Item>
                    <NavDropdown.Item href="/manager/analytics">Analytics</NavDropdown.Item>
                  </NavDropdown> */}
                  <Nav.Link as={Link} to="/login">Login</Nav.Link>
                  <Nav.Link as={Link} to="/register">Register</Nav.Link>
                </Nav>
              </Navbar.Collapse>
            </Container>
          </Navbar>
    </div>
  )
}

export default Header
