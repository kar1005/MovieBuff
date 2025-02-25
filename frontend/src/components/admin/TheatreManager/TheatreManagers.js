import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  fetchTheaterManagers, 
  deleteTheaterManager, 
  selectTheaterManagers, 
  selectUserLoading, 
  selectUserError 
} from '../../../redux/slices/userSlice';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Table, 
  Spinner, 
  Alert,
  Modal 
} from 'react-bootstrap';
import { Trash2, Plus, UserPlus } from 'lucide-react';
import './TheatreManagers.css';

const TheatreManagers = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const theaterManagers = useSelector(selectTheaterManagers);
  const loading = useSelector(selectUserLoading);
  const error = useSelector(selectUserError);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [managerToDelete, setManagerToDelete] = useState(null);

  useEffect(() => {
    dispatch(fetchTheaterManagers());
  }, [dispatch]);

  const handleAddTheaterManager = () => {
    navigate('/admin/theater-add');
  };

  const confirmDeleteManager = (manager) => {
    setManagerToDelete(manager);
    setShowDeleteModal(true);
  };

  const handleDeleteManager = () => {
    if (managerToDelete) {
      dispatch(deleteTheaterManager(managerToDelete.id));
      setShowDeleteModal(false);
      setManagerToDelete(null);
    }
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="theater-managers-container">
      <Row className="mb-4 align-items-center">
        <Col>
          <h2 className="page-title">Theater Managers</h2>
        </Col>
        <Col className="text-end">
          <Button 
            variant="primary" 
            onClick={handleAddTheaterManager}
            className="add-manager-btn"
          >
            <UserPlus size={20} className="me-2" />
            Add Theater Manager
          </Button>
        </Col>
      </Row>

      <Card>
        <Card.Body>
          <Table responsive hover className="theater-managers-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone Number</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {theaterManagers.map((manager) => (
                <tr key={manager.id}>
                  <td>{manager.username}</td>
                  <td>{manager.phoneNumber}</td>
                  <td>{manager.email}</td>
                  <td>
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      onClick={() => confirmDeleteManager(manager)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {theaterManagers.length === 0 && (
            <div className="text-center text-muted py-4">
              No theater managers found
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal 
        show={showDeleteModal} 
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the theater manager 
          <strong> {managerToDelete?.username}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteManager}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TheatreManagers;