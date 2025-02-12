// src/components/theater/TheaterScreens.js
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Table, Button, Badge, Row, Col, Spinner } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { Edit, Plus, Monitor } from 'lucide-react';
import { fetchTheaterById, fetchTheaterScreens } from '../../redux/slices/theaterSlice';

const TheaterScreens = () => {
  const { theaterId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentTheater, screens, loading } = useSelector((state) => ({
    currentTheater: state.theater.currentTheater,
    screens: state.theater.screens || {},
    loading: state.theater.loading,
  }));

  useEffect(() => {
    if (theaterId) {
      dispatch(fetchTheaterById(theaterId));
      dispatch(fetchTheaterScreens(theaterId));
    }
  }, [dispatch, theaterId]);

  if (loading || !currentTheater) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  // Ensure we have an array to map over, even if empty
  const theaterScreens = (screens[theaterId] || []).map(screen => ({
    ...screen,
    supportedExperiences: screen.supportedExperiences || [] // Ensure this is always an array
  }));

  return (
    <Container fluid className="py-4">
      <Card className="mb-4">
        <Card.Header className="bg-white">
          <Row className="align-items-center">
            <Col>
              <h5 className="mb-0">{currentTheater?.name || 'Theater'}</h5>
              <small className="text-muted">
                {currentTheater?.location.address}, {currentTheater?.location.city}, {currentTheater?.location.state}
              </small>
            </Col>
            <Col xs="auto">
              <Button
                variant="primary"
                onClick={() => navigate(`/manager/theaters/${theaterId}/screens/add`)}
                className="d-flex align-items-center gap-2"
              >
                <Plus size={18} />
                Add Screen
              </Button>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          <Row className="g-4">
            <Col md={6} lg={3}>
              <Card className="h-100">
                <Card.Body>
                  <h6 className="text-muted mb-2">Total Screens</h6>
                  <h3>{currentTheater?.totalScreens || 0}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} lg={3}>
              <Card className="h-100">
                <Card.Body>
                  <h6 className="text-muted mb-2">Status</h6>
                  <Badge bg={currentTheater?.status === 'ACTIVE' ? 'success' : 'warning'}>
                    {currentTheater?.status || 'N/A'}
                  </Badge>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header className="bg-white">
          <h5 className="mb-0">Screen List</h5>
        </Card.Header>
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Screen Number</th>
                <th>Name</th>
                <th>Capacity</th>
                <th>Features</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {theaterScreens.length > 0 ? (
                theaterScreens.map((screen) => (
                  <tr key={screen.screenNumber}>
                    <td>
                      <Badge bg="info" className="d-flex align-items-center gap-1" style={{ width: 'fit-content' }}>
                        <Monitor size={14} />
                        Screen {screen.screenNumber}
                      </Badge>
                    </td>
                    <td>{screen.screenName}</td>
                    <td>{screen.totalSeats || 0} seats</td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {(screen.supportedExperiences || []).map((exp) => (
                          <Badge key={exp} bg="secondary" className="me-1">
                            {exp}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => navigate(`/manager/theaters/${theaterId}/screens/${screen.screenNumber}/edit`)}
                      >
                        <Edit size={16} />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    <div className="text-muted">No screens found for this theater</div>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TheaterScreens;