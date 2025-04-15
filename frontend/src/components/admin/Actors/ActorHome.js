import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Container, 
  Row, 
  Col, 
  Spinner, 
  Table, 
  Form, 
  Button, 
  Badge, 
  Card,
  Alert,
  Modal
} from 'react-bootstrap';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Film,
  Star,
  Globe,
  Calendar,
  Users,
  AlertTriangle
} from 'lucide-react';
import { 
  fetchActors, 
  deleteActor,
  selectAllActors,
  selectActorLoading,
  selectActorError
} from '../../../redux/slices/actorSlice';
import './ActorHome.css';
// Component with inline styles to avoid CSS conflicts
function ActorHome() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    // Redux selectors
    const actors = useSelector(selectAllActors);
    const loading = useSelector(selectActorLoading);
    const error = useSelector(selectActorError);
    
    // Local state
    const [filteredActors, setFilteredActors] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [actorToDelete, setActorToDelete] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [itemsPerPage] = useState(10);
    const [filters, setFilters] = useState({
      name: '',
      languages: [],
      hasFullProfile: null
    });

    // Styles object - keeps all styles in JavaScript to avoid CSS conflicts
    const styles = {
        actorsContainer: {
            padding: 0,
            marginBottom: '2rem'
        },
        actorsTable: {
            fontSize: '0.95rem'
        },
        tableHeader: {
            fontWeight: 600,
            whiteSpace: 'nowrap'
        },
        actorImageContainer: {
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            position: 'relative',
            backgroundColor: '#f8f9fa',
            aspectRatio: '1/1'
        },
        actorImage: {
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%',
            position: 'absolute',
            top: 0,
            left: 0
        },
        actorImagePlaceholder: {
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#e9ecef',
            color: '#6c757d',
            borderRadius: '50%',
            flexShrink: 0
        },
        statusBadge: {
            fontSize: '0.8rem',
            padding: '0.35em 0.65em',
            fontWeight: 500
        },
        searchContainer: {
            maxWidth: '300px',
            position: 'relative'
        },
        searchIcon: {
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)'
        },
        searchInput: {
            paddingLeft: '2rem'
        },
        deleteModalImage: {
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            objectFit: 'cover',
            marginBottom: '1rem',
            border: '2px solid #dc3545',
            opacity: 0.8
        },
        deleteActorPreview: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '1.5rem'
        },
        paginationSection: {
            backgroundColor: '#f8f9fa',
            margin: '0 -1.25rem -1.25rem',
            padding: '1rem 1.25rem',
            borderRadius: '0 0 0.375rem 0.375rem'
        },
        paginationInfo: {
            color: '#6c757d'
        },
        clickableRow: {
            cursor: 'pointer'
        }
    };

    // Fetch actors on mount and when filters/pagination change
    useEffect(() => {
        dispatch(fetchActors({ 
            page: currentPage, 
            size: itemsPerPage,
            filters: filters
        }));
    }, [dispatch, currentPage, itemsPerPage, filters]);

    // Update filtered actors when search term changes
    useEffect(() => {
        if (actors?.content) {
            handleSearch(searchTerm);
        }
    }, [searchTerm, actors]);

    // Handle search
    const handleSearch = (value) => {
        if (!actors?.content) return;
        
        const searchValue = value.toLowerCase().trim();
        if (!searchValue) {
            setFilteredActors(actors.content);
            return;
        }
        
        const filtered = actors.content.filter(actor => 
            actor.name?.toLowerCase().includes(searchValue) ||
            actor.languages?.some(lang => lang.toLowerCase().includes(searchValue)) ||
            actor.filmography?.some(film => film.movieTitle?.toLowerCase().includes(searchValue))
        );
        setFilteredActors(filtered);
    };

    // Handle adding new actor
    const handleAddActor = () => {
        navigate('/admin/actors/add');
    };
    
    // Handle editing actor
    const handleEditActor = (actorId) => {
        navigate(`/admin/actors/edit/${actorId}`);
    };
    
    // Handle view actor details
    const handleViewActor = (actorId) => {
        navigate(`/admin/actors/view/${actorId}`);
    };
    
    // Handle delete click
    const handleDeleteClick = (actor, e) => {
        e.stopPropagation();
        setActorToDelete(actor);
        setShowDeleteModal(true);
    };

    // Handle confirmation of delete
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

    // Cancel delete
    const cancelDelete = () => {
        setShowDeleteModal(false);
        setActorToDelete(null);
    };

    // Calculate average rating from filmography
    const calculateAverageRating = (actor) => {
        if (!actor.filmography || actor.filmography.length === 0) {
            return 'N/A';
        }
        
        const validRatings = actor.filmography.filter(film => film.movieRating);
        if (validRatings.length === 0) {
            return 'N/A';
        }
        
        const sum = validRatings.reduce((total, film) => total + film.movieRating, 0);
        return (sum / validRatings.length).toFixed(1);
    };

    // Render filmography summary
    const renderFilmography = (filmography) => {
        if (!filmography || filmography.length === 0) return 'No filmography';
        
        return filmography.slice(0, 2).map(film => film.movieTitle).join(', ') + 
              (filmography.length > 2 ? ` + ${filmography.length - 2} more` : '');
    };

    // Render profile status badge
    const renderProfileStatus = (isProfile) => {
        return (
            <Badge bg={isProfile ? 'success' : 'warning'} style={styles.statusBadge}>
                {isProfile ? 'Complete' : 'Basic'}
            </Badge>
        );
    };

    if (loading && !actors?.content?.length) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" role="status" variant="primary" style={{ width: '3rem', height: '3rem' }}>
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="py-5">
                <Alert variant="danger">
                    {error}
                </Alert>
            </Container>
        );
    }

    // Set filtered actors if not already set
    if (filteredActors.length === 0 && actors?.content?.length > 0 && !searchTerm) {
        setFilteredActors(actors.content);
    }

    return (
        <Container fluid style={styles.actorsContainer} className="py-4">
            <Card className="shadow-sm border-0">
                <Card.Body>
                    <Row className="mb-4 align-items-center">
                        <Col xs={12} md={6}>
                            <h2 className="mb-0 fw-bold">
                                <Users className="me-2" size={24} />
                                Actors
                            </h2>
                            <p className="text-muted mt-1 mb-0">
                                {actors?.totalElements || 0} actors in database
                            </p>
                        </Col>
                        <Col xs={12} md={6}>
                            <div className="d-flex flex-column flex-md-row gap-2 mt-3 mt-md-0 justify-content-md-end">
                                <div style={styles.searchContainer} className="flex-grow-1 me-md-2">
                                    <Search style={styles.searchIcon} size={18} />
                                    <Form.Control
                                        type="text"
                                        placeholder="Search actors..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={styles.searchInput}
                                    />
                                </div>
                                <Button 
                                    variant="primary"
                                    onClick={handleAddActor}
                                    className="d-flex align-items-center"
                                >
                                    <Plus size={18} className="me-1" />
                                    <span>Add Actor</span>
                                </Button>
                            </div>
                        </Col>
                    </Row>

                    <div className="table-responsive">
                        <Table hover style={styles.actorsTable} className="align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th style={styles.tableHeader}>Actor</th>
                                    <th style={styles.tableHeader}><Globe size={16} className="me-1" /> Languages</th>
                                    <th style={styles.tableHeader}><Film size={16} className="me-1" /> Filmography</th>
                                    <th style={styles.tableHeader}><Star size={16} className="me-1" /> Rating</th>
                                    <th style={styles.tableHeader}><Calendar size={16} className="me-1" /> Career Start</th>
                                    <th style={styles.tableHeader}>Status</th>
                                    <th style={styles.tableHeader} className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredActors?.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-4 text-muted">
                                            No actors found matching your search.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredActors?.map((actor) => (
                                        <tr key={actor.id} onClick={() => handleViewActor(actor.id)} style={styles.clickableRow}>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    {actor.imageUrl ? (
                                                        <div style={styles.actorImageContainer} className="me-3">
                                                            <img 
                                                                src={actor.imageUrl}
                                                                alt={`${actor.name}`}
                                                                style={styles.actorImage}
                                                                className="shadow-sm"
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = '/default-avatar.png';
                                                                }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div style={styles.actorImagePlaceholder} className="me-3">
                                                            <Users size={24} />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="fw-bold">{actor.name}</div>
                                                        {actor.dateOfBirth && (
                                                            <div className="small text-muted">
                                                                Born: {new Date(actor.dateOfBirth).getFullYear()}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{actor.languages?.join(', ') || 'N/A'}</td>
                                            <td>{renderFilmography(actor.filmography)}</td>
                                            <td>
                                                {calculateAverageRating(actor) !== 'N/A' && (
                                                    <div className="d-flex align-items-center">
                                                        <Star size={16} className="text-warning me-1" />
                                                        <span>{calculateAverageRating(actor)}</span>
                                                    </div>
                                                )}
                                                {calculateAverageRating(actor) === 'N/A' && 'N/A'}
                                            </td>
                                            <td>{actor.careerStartDate ? new Date(actor.careerStartDate).getFullYear() : 'N/A'}</td>
                                            <td>{renderProfileStatus(actor.isProfile)}</td>
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <div className="d-flex justify-content-end gap-2">
                                                    <Button 
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEditActor(actor.id);
                                                        }}
                                                        className="d-flex align-items-center"
                                                    >
                                                        <Edit size={16} className="me-1" />
                                                        <span className="d-none d-md-inline">Edit</span>
                                                    </Button>
                                                    <Button 
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={(e) => handleDeleteClick(actor, e)}
                                                        className="d-flex align-items-center"
                                                    >
                                                        <Trash2 size={16} className="me-1" />
                                                        <span className="d-none d-md-inline">Delete</span>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {actors?.totalPages > 1 && (
                        <div style={styles.paginationSection} className="mt-4 pt-3 border-top d-flex justify-content-between align-items-center">
                            <div style={styles.paginationInfo} className="small">
                                Showing page {currentPage + 1} of {actors.totalPages} 
                                ({Math.min((currentPage + 1) * itemsPerPage, actors.totalElements)} of {actors.totalElements} actors)
                            </div>
                            
                            <ul className="pagination pagination-sm mb-0">
                                <li className={`page-item ${currentPage === 0 ? 'disabled' : ''}`}>
                                    <button 
                                        className="page-link" 
                                        onClick={() => setCurrentPage(0)}
                                        disabled={currentPage === 0}
                                    >
                                        First
                                    </button>
                                </li>
                                <li className={`page-item ${currentPage === 0 ? 'disabled' : ''}`}>
                                    <button 
                                        className="page-link" 
                                        onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                        disabled={currentPage === 0}
                                    >
                                        <span aria-hidden="true">&laquo;</span>
                                    </button>
                                </li>
                                
                                {/* Numbered Pages */}
                                {[...Array(actors.totalPages).keys()].slice(
                                    Math.max(0, currentPage - 2),
                                    Math.min(actors.totalPages, currentPage + 3)
                                ).map(page => (
                                    <li 
                                        key={page} 
                                        className={`page-item ${currentPage === page ? 'active' : ''}`}
                                    >
                                        <button 
                                            className="page-link" 
                                            onClick={() => setCurrentPage(page)}
                                        >
                                            {page + 1}
                                        </button>
                                    </li>
                                ))}
                                
                                <li className={`page-item ${currentPage >= actors.totalPages - 1 ? 'disabled' : ''}`}>
                                    <button 
                                        className="page-link" 
                                        onClick={() => setCurrentPage(prev => Math.min(actors.totalPages - 1, prev + 1))}
                                        disabled={currentPage >= actors.totalPages - 1}
                                    >
                                        <span aria-hidden="true">&raquo;</span>
                                    </button>
                                </li>
                                <li className={`page-item ${currentPage >= actors.totalPages - 1 ? 'disabled' : ''}`}>
                                    <button 
                                        className="page-link" 
                                        onClick={() => setCurrentPage(actors.totalPages - 1)}
                                        disabled={currentPage >= actors.totalPages - 1}
                                    >
                                        Last
                                    </button>
                                </li>
                            </ul>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={cancelDelete} centered className="delete-modal">
                <Modal.Header closeButton>
                    <Modal.Title className="text-danger">
                        <AlertTriangle className="me-2" />
                        Confirm Deletion
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {actorToDelete && (
                        <>
                            <div style={styles.deleteActorPreview}>
                                {actorToDelete.imageUrl ? (
                                    <img 
                                        src={actorToDelete.imageUrl} 
                                        alt={actorToDelete.name} 
                                        style={styles.deleteModalImage}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = '/default-avatar.png';
                                        }}
                                    />
                                ) : (
                                    <div style={styles.actorImagePlaceholder} className="mb-2">
                                        <Users size={40} />
                                    </div>
                                )}
                                <h5>{actorToDelete.name}</h5>
                            </div>
                            <p className="mb-0 text-center">
                                Are you sure you want to delete this actor? 
                                This action cannot be undone.
                            </p>
                            {actorToDelete.filmography && actorToDelete.filmography.length > 0 && (
                                <Alert variant="warning" className="mt-3 mb-0">
                                    <AlertTriangle size={16} className="me-2" />
                                    This actor is associated with {actorToDelete.filmography.length} movies.
                                    Deleting this record may affect movie cast listings.
                                </Alert>
                            )}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={cancelDelete}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={confirmDelete}>
                        Delete Actor
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}

export default ActorHome;