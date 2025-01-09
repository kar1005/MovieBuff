import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container, Navbar, Nav, NavDropdown } from 'react-bootstrap';
import { Provider } from 'react-redux';
import store from './redux/store';

// Theater Manager Components
import TheaterManagerHome from './components/theater/TheaterManagerHome';
import TheaterList from './components/theater/TheaterList';
import AddTheater from './components/theater/AddTheater';
import TheaterEdit from './components/theater/TheaterEdit';
import ScreenSetup from './components/theater/ScreenSetup';
import ShowList from './components/theater/ShowList';
import ShowSchedule from './components/theater/ShowSchedule';
import Analytics from './components/theater/Analytics';

// Import other components for customer and admin interfaces
// ...

// Styles
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/main.css';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="App">
          <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
            <Container>
              <Navbar.Brand href="/">MovieBuff</Navbar.Brand>
              <Navbar.Toggle aria-controls="basic-navbar-nav" />
              <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="me-auto">
                  <NavDropdown title="Theater Manager" id="manager-nav-dropdown">
                    <NavDropdown.Item href="/manager/theaters">Theaters</NavDropdown.Item>
                    <NavDropdown.Item href="/manager/screen-setup">Screen Setup</NavDropdown.Item>
                    <NavDropdown.Item href="/manager/shows">Shows</NavDropdown.Item>
                    <NavDropdown.Item href="/manager/analytics">Analytics</NavDropdown.Item>
                  </NavDropdown>
                  {/* Add more navigation items for customer and admin interfaces */}
                </Nav>
              </Navbar.Collapse>
            </Container>
          </Navbar>

          <main className="py-3">
            <Routes>
              {/* Theater Manager Routes */}
              <Route path="/manager" element={<TheaterManagerHome />} />
              <Route path="/manager/theaters" element={<TheaterList />} />
              <Route path="/manager/theaters/add" element={<AddTheater />} />
              <Route path="/manager/theaters/:id" element={<TheaterEdit />} />
              <Route path="/manager/screen-setup" element={<ScreenSetup />} />
              <Route path="/manager/shows" element={<ShowList />} />
              <Route path="/manager/shows/schedule" element={<ShowSchedule />} />
              <Route path="/manager/analytics" element={<Analytics />} />

              {/* Add routes for customer and admin interfaces */}
              
              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/manager" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </Provider>
  );
}

export default App;