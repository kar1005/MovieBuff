// src/pages/theater/TheaterManagerHome.js
import React, { useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Alert,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Plus, Settings, Clock, BarChart2, Edit } from "lucide-react";
import {
  setTheaters,
  setShows,
  setLoading,
} from "../../redux/slices/theaterSlice";

const TheaterManagerHome = () => {
  const dispatch = useDispatch();
  const { theaters, shows, loading } = useSelector((state) => state.theater);

  useEffect(() => {
    const fetchData = async () => {
      dispatch(setLoading(true));
      try {
        // In production, replace with actual API calls
        const mockTheaters = [
          {
            id: 1,
            name: "Cineplex Central",
            location: "Downtown",
            screens: 4,
            status: "ACTIVE",
          },
        ];

        const mockShows = [
          {
            id: 1,
            movieTitle: "Inception",
            screenNumber: 1,
            showTime: "2025-01-04T14:30:00",
            language: "English",
            bookingStatus: "75%",
          },
        ];

        dispatch(setTheaters(mockTheaters));
        dispatch(setShows(mockShows));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchData();
  }, [dispatch]);

  const QuickActionCard = ({ icon: Icon, title, description, link }) => (
    <Card className="h-100 quick-action-card">
      <Card.Body className="d-flex flex-column">
        <div className="icon-wrapper mb-3">
          <Icon size={24} className="text-primary" />
        </div>
        <Card.Title>{title}</Card.Title>
        <Card.Text className="text-muted">{description}</Card.Text>
        <Link to={link} className="mt-auto">
          <Button variant="primary" className="w-100">
            Get Started
          </Button>
        </Link>
      </Card.Body>
    </Card>
  );

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">Loading...</div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="mb-4">Theater Manager Dashboard</h2>
        </Col>
      </Row>

      <Row className="mb-4 g-3">
        <Col sm={6} lg={3}>
          <QuickActionCard
            icon={Plus}
            title="Add Theater"
            description="Register a new theater location"
            link="/manager/add-theater"
          />
        </Col>
        <Col sm={6} lg={3}>
          <QuickActionCard
            icon={Settings}
            title="Screen Setup"
            description="Design theater layout and seating"
            link="/manager/screen-setup"
          />
        </Col>
        <Col sm={6} lg={3}>
          <QuickActionCard
            icon={Clock}
            title="Schedule Shows"
            description="Manage show timings and movies"
            link="/manager/schedule"
          />
        </Col>
        <Col sm={6} lg={3}>
          <QuickActionCard
            icon={BarChart2}
            title="Analytics"
            description="View booking statistics"
            link="/manager/analytics"
          />
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={6}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">My Theaters</h5>
              <Link to="/manager/theaters">
                <Button variant="outline-primary" size="sm">
                  View All
                </Button>
              </Link>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Location</th>
                    <th>Screens</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {theaters.map((theater) => (
                    <tr key={theater.id}>
                      <td>{theater.name}</td>
                      <td>{theater.location}</td>
                      <td>{theater.screens}</td>
                      <td>
                        <span
                          className={`badge bg-${
                            theater.status === "ACTIVE" ? "success" : "warning"
                          }`}
                        >
                          {theater.status}
                        </span>
                      </td>
                      <td>
                        <Link to={`/manager/theaters/${theater.id}`}>
                          <Button variant="link" size="sm" className="p-0">
                            <Edit size={16} />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card>
            // src/pages/theater/TheaterManagerHome.js (continued)
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Today's Shows</h5>
              <Link to="/manager/shows">
                <Button variant="outline-primary" size="sm">
                  View All
                </Button>
              </Link>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Movie</th>
                    <th>Screen</th>
                    <th>Time</th>
                    <th>Language</th>
                    <th>Booking Status</th>
                  </tr>
                </thead>
                <tbody>
                  {shows.map((show) => (
                    <tr key={show.id}>
                      <td>{show.movieTitle}</td>
                      <td>{show.screenNumber}</td>
                      <td>{new Date(show.showTime).toLocaleTimeString()}</td>
                      <td>{show.language}</td>
                      <td>{show.bookingStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default TheaterManagerHome;
