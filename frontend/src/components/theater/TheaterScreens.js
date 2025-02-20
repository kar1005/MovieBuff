import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Table, Button, Badge, Row, Col, Spinner, Modal, Alert } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { Edit, Plus, Monitor, Trash2 } from 'lucide-react';
import { fetchTheaterById, fetchTheaterScreens, deleteScreen } from '../../redux/slices/theaterSlice';
import subscriptionService from '../../services/subscriptionService';

const TheaterScreens = () => {
  const { theaterId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Add subscription state
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  
  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [screenToDelete, setScreenToDelete] = useState(null);
  
  const { currentTheater, screens, loading } = useSelector((state) => ({
    currentTheater: state.theater.currentTheater,
    screens: state.theater.screens || {},
    loading: state.theater.loading,
  }));

  // Check subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const managerId = localStorage.getItem('userId');
        const isActive = await subscriptionService.checkSubscriptionStatus(managerId);
        setSubscriptionActive(isActive);
      } catch (error) {
        console.error('Failed to check subscription status:', error);
        setSubscriptionActive(false);
      } finally {
        setCheckingSubscription(false);
      }
    };

    checkSubscription();
  }, []);

  useEffect(() => {
    if (theaterId) {
      dispatch(fetchTheaterById(theaterId));
      dispatch(fetchTheaterScreens(theaterId));
    }
  }, [dispatch, theaterId]);

  const handleDeleteClick = (screen) => {
    if (!subscriptionActive) return;
    setScreenToDelete(screen);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (screenToDelete && subscriptionActive) {
      try {
        await dispatch(deleteScreen({ theaterId, screenNumber: screenToDelete.screenNumber })).unwrap();
        dispatch(fetchTheaterScreens(theaterId));
      } catch (error) {
        console.error('Failed to delete screen:', error);
      }
    }
    setShowDeleteModal(false);
    setScreenToDelete(null);
  };

  const handleSubscribeClick = () => {
    navigate('/manager/subscription');
  };

  if (loading || checkingSubscription || !currentTheater) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  // Ensure we have an array to map over
  const theaterScreens = (screens[theaterId] || []).map(screen => ({
    ...screen,
    supportedExperiences: screen.supportedExperiences || []
  }));

  return (
    <Container fluid className="py-4">
      {/* Subscription Alert */}
      {!subscriptionActive && (
        <Alert variant="warning" className="mb-4">
          <Alert.Heading>Subscription Required</Alert.Heading>
          <p>
            You need an active subscription to manage theater screens. Your current subscription is inactive.
          </p>
          <div className="d-flex justify-content-end">
            <Button variant="warning" onClick={handleSubscribeClick}>
              Subscribe Now
            </Button>
          </div>
        </Alert>
      )}

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
                disabled={!subscriptionActive}
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
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          disabled={!subscriptionActive}
                          onClick={() => navigate(`/manager/theaters/${theaterId}/screens/${screen.screenNumber}/edit`)}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          disabled={!subscriptionActive}
                          onClick={() => handleDeleteClick(screen)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
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

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete Screen {screenToDelete?.screenNumber}? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Delete Screen
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TheaterScreens;