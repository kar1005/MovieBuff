// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Container, Navbar, Nav } from 'react-bootstrap';
import TheaterLayoutDesigner from './components/theater/TheaterLayoutDesigner';

// Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';
// Import custom styles
import './styles/TheaterLayout.css';
import TheaterLayoutViewer from './components/theater/TheaterLayoutViewer';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar bg="dark" variant="dark" expand="lg">
          <Container>
            <Navbar.Brand as={Link} to="/">MovieBuff</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/theater-setup">Theater Setup</Nav.Link>
                <Nav.Link as={Link} to="/theater-layout">Theater Layout</Nav.Link>

              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        <Routes>
          <Route path="/" element={
            <Container className="py-4 text-center">
              <h1>Welcome to MovieBuff</h1>
              <p>Click on Theater Setup to design your theater layout</p>
            </Container>
          } />
          <Route path="/theater-setup" element={<TheaterLayoutDesigner />} />
          <Route path="/theater-layout" element={<TheaterLayoutViewer />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;