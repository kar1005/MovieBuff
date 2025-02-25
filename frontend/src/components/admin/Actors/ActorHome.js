import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Table, 
  Button, 
  Form, 
  InputGroup,
  Modal,
  Badge,
  Pagination,
  Alert,
  Spinner
} from 'react-bootstrap';
import { Search, Plus, Edit2, Trash2, Film, Award, Star } from 'lucide-react';
import { 
  fetchActors, 
  deleteActor, 
  searchActors,
  selectAllActors,
  selectActorLoading,
  selectActorError
} from '../../../redux/slices/actorSlice';
import './ActorHome.css';

const ActorHome = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actorToDelete, setActorToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    name: '',
    languages: [],
    hasFullProfile: null
  });

  // Redux selectors
  const actors = useSelector(selectAllActors);
  const loading = useSelector(selectActorLoading);
  const error = useSelector(selectActorError);

  // Fetch actors on mount and when filters/pagination change
  useEffect(() => {
    dispatch(fetchActors({ 
      page: currentPage, 
      size: itemsPerPage,
      filters: filters
    }));
  }, [dispatch, currentPage, itemsPerPage, filters]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, name: searchTerm }));
    setCurrentPage(0);
  };

  // Handle language filter change
  const handleLanguageChange = (selected) => {
    const selectedLanguages = Array.from(selected.selectedOptions, option => option.value);
    setSelectedLanguages(selectedLanguages);
    setFilters(prev => ({ ...prev, languages: selectedLanguages }));
    setCurrentPage(0);
  };

  // Handle delete
  const handleDeleteClick = (actor) => {
    setActorToDelete(actor);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (actorToDelete) {
      try {
        await dispatch(deleteActor(actorToDelete.id)).unwrap();
        setShowDeleteModal(false);
        // Refresh the current page
        dispatch(fetchActors({ page: currentPage, size: itemsPerPage, filters }));
      } catch (error) {
        console.error('Failed to delete actor:', error);
      }
    }
  };

  // Calculate average rating from filmography
  const calculateAverageRating = (actor) => {
    if (!actor.filmography || actor.filmography.length === 0) {
      return 0;
    }
    
    const validRatings = actor.filmography.filter(film => film.movieRating);
    if (validRatings.length === 0) {
      return 0;
    }
    
    const sum = validRatings.reduce((total, film) => total + film.movieRating, 0);
    return sum / validRatings.length;
  };

  // Handle pagination
  const renderPagination = () => {
    const totalPages = Math.ceil(actors?.totalElements / itemsPerPage);
    let items = [];

    for (let number = 0; number < totalPages; number++) {
      items.push(
        <Pagination.Item
          key={number}
          active={number === currentPage}
          onClick={() => setCurrentPage(number)}
        >
          {number + 1}
        </Pagination.Item>
      );
    }

    return (
      <div className="pagination-container">
        <Pagination>
          <Pagination.Prev
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
          />
          {items}
          <Pagination.Next
            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage === totalPages - 1}
          />
        </Pagination>
      </div>
    );
  };

  // Loading state
  if (loading && !actors?.content?.length) {
    return (
      <div className="loading-spinner-container">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="alert-container">
        <Alert variant="danger">
          {error}
        </Alert>
      </div>
    );
  }

  return (
    <Container fluid className="py-4">
      {/* Header Section */}
      <Row className="header-section">
        <Col>
          <h2 className="mb-0">Manage Actors</h2>
          <p className="text-muted">
            Total {actors?.totalElements || 0} actors in the database
          </p>
        </Col>
        <Col xs="auto">
          <Button 
            variant="primary" 
            onClick={() => navigate('/admin/actors/add')}
            className="add-button"
          >
            <Plus size={18} />
            Add New Actor
          </Button>
        </Col>
      </Row>

      {/* Filters Section */}
      <Card className="filter-card">
        <Card.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form onSubmit={handleSearch} className="search-form">
                <InputGroup>
                  <Form.Control
                    className="search-input"
                    placeholder="Search actors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button variant="outline-secondary" type="submit" className="search-button">
                    <Search size={18} />
                  </Button>
                </InputGroup>
              </Form>
            </Col>
            <Col md={6}>
              <Form.Select
                className="filter-select"
                multiple
                value={selectedLanguages}
                onChange={(e) => handleLanguageChange(e.target)}
              >
                <option value="">Filter by Language</option>
                <option value="Hindi">Hindi</option>
                <option value="English">English</option>
                <option value="Tamil">Tamil</option>
                <option value="Telugu">Telugu</option>
                <option value="Malayalam">Malayalam</option>
                <option value="Kannada">Kannada</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Actors Table */}
      <Card className="data-card">
        <Card.Body>
          <Table responsive className="actor-table">
            <thead>
              <tr>
                <th>Actor</th>
                <th>Languages</th>
                <th>Movies</th>
                <th>Rating</th>
                <th>Profile Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {actors?.content?.map((actor) => (
                <tr key={actor.id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <img
                        className="actor-avatar"
                        src={actor.imageUrl || '/default-avatar.png'}
                        alt={actor.name}
                      />
                      <div>
                        <div className="fw-medium">{actor.name}</div>
                        {actor.dateOfBirth && (
                          <small className="text-muted">
                            Born: {new Date(actor.dateOfBirth).getFullYear()}
                          </small>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    {actor.languages?.map((lang) => (
                      <Badge key={lang} bg="secondary" className="language-badge">
                        {lang}
                      </Badge>
                    ))}
                  </td>
                  <td>
                    <div className="stats-display">
                      <Film size={16} />
                      <span>{actor.filmography?.length || 0}</span>
                    </div>
                  </td>
                  <td>
                    {actor.filmography && actor.filmography.length > 0 ? (
                      <div className="stats-display">
                        <Star className="text-warning" size={16} />
                        <span>{calculateAverageRating(actor).toFixed(1)}</span>
                      </div>
                    ) : (
                      <span className="text-muted">Not rated</span>
                    )}
                  </td>
                  <td>
                    <Badge 
                      bg={actor.isProfile ? 'success' : 'warning'} 
                      className={`status-badge ${actor.isProfile ? 'complete' : 'basic'}`}
                    >
                      {actor.isProfile ? 'Complete' : 'Basic'}
                    </Badge>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => navigate(`/admin/actors/edit/${actor.id}`)}
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteClick(actor)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {actors?.content?.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted mb-0">No actors found matching your criteria</p>
            </div>
          )}

          {actors?.content?.length > 0 && renderPagination()}
        </Card.Body>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal 
        show={showDeleteModal} 
        onHide={() => setShowDeleteModal(false)}
        className="delete-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">
            Are you sure you want to delete {actorToDelete?.name}? This action will also remove all 
            associated filmography data and cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete Actor
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ActorHome;