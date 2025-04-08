import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Table, Button, Badge, Spinner, Modal, Tabs, Tab, Alert } from 'react-bootstrap';
import { Star, Flag, CheckCircle, XCircle, Filter, ChevronDown, Search, AlertTriangle, Eye } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllReviews, getMovieReviews, moderateReview } from '../../../redux/slices/reviewSlice';
import { getAllMovies } from '../../../redux/slices/movieSlice';
import './Reviews.css'
function Reviews() {
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMovie, setSelectedMovie] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReview, setSelectedReview] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [moderationNote, setModerationNote] = useState('');
    const [moderationStatus, setModerationStatus] = useState('');
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationType, setNotificationType] = useState('');
    
    // Get reviews and movies from Redux store
    const { reviews, movieReviews, error: reviewError } = useSelector(state => state.reviews);
    const { movies, error: movieError } = useSelector(state => state.movies);
    
    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                await Promise.all([
                    dispatch(getAllMovies({ filters: {} })),
                    dispatch(getAllReviews({}))
                ]);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchData();
    }, [dispatch]);
    
    // Filter by movie ID when selectedMovie changes
    useEffect(() => {
        if (selectedMovie && selectedMovie !== 'all') {
            dispatch(getMovieReviews({ movieId: selectedMovie, status: selectedStatus !== 'all' ? selectedStatus : undefined }));
        }
    }, [selectedMovie, selectedStatus, dispatch]);
    
    // Function to handle opening the moderation modal
    const handleOpenModal = (review) => {
        setSelectedReview(review);
        setModerationNote(review.moderationNotes || '');
        setModerationStatus(review.status || 'APPROVED');
        setShowModal(true);
    };
    
    // Function to handle review moderation
    const handleModerateReview = async () => {
        if (!selectedReview) return;
        
        try {
            await dispatch(moderateReview({
                id: selectedReview.id,
                moderationData: {
                    moderatedBy: 'admin', // Should be the real admin ID or username
                    moderationNotes: moderationNote,
                    status: moderationStatus
                }
            }));
            
            setShowModal(false);
            setNotificationType('success');
            setNotificationMessage(`Review status changed to ${moderationStatus}`);
            
            // Refresh reviews based on current filters
            if (selectedMovie !== 'all') {
                dispatch(getMovieReviews({ movieId: selectedMovie, status: selectedStatus !== 'all' ? selectedStatus : undefined }));
            } else {
                dispatch(getAllReviews({}));
            }
        } catch (error) {
            console.error('Error moderating review:', error);
            setNotificationType('danger');
            setNotificationMessage('Failed to update review status');
        }
    };
    
    // Filter reviews based on search term and selected status
    const filteredReviews = () => {
        let filteredData = selectedMovie === 'all' ? reviews : movieReviews;
        
        if (!filteredData) return [];
        
        // Filter by status if not 'all'
        if (selectedStatus !== 'all') {
            filteredData = filteredData.filter(review => review.status === selectedStatus);
        }
        
        // Filter by search term
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filteredData = filteredData.filter(review => 
                review.content?.toLowerCase().includes(term) || 
                review.userDisplayName?.toLowerCase().includes(term)
            );
        }
        
        return filteredData;
    };
    
    // Get flagged (reported) reviews
    const flaggedReviews = () => {
        let allReviews = selectedMovie === 'all' ? reviews : movieReviews;
        if (!allReviews) return [];
        
        return allReviews.filter(review => 
            review.reportCount > 0 || review.status === 'FLAGGED'
        );
    };
    
    // Get the movie title by ID
    const getMovieTitle = (movieId) => {
        if (!movies) return 'Unknown Movie';
        const movie = movies.find(m => m.id === movieId);
        return movie ? movie.title : 'Unknown Movie';
    };
    
    // Render star rating
    const renderStarRating = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                stars.push(<Star key={i} className="text-warning" fill="#ffc107" size={16} />);
            } else if (i === fullStars + 1 && hasHalfStar) {
                stars.push(<Star key={i} className="text-warning" fill="#ffc107" strokeWidth={0} size={16} style={{ clipPath: 'inset(0 50% 0 0)' }} />);
            } else {
                stars.push(<Star key={i} className="text-muted" size={16} />);
            }
        }
        
        return <div className="d-flex">{stars}</div>;
    };
    
    // Render status badge
    const renderStatusBadge = (status) => {
        let badgeColor = 'secondary';
        
        switch(status) {
            case 'APPROVED':
                badgeColor = 'success';
                break;
            case 'PENDING':
                badgeColor = 'warning';
                break;
            case 'REJECTED':
                badgeColor = 'danger';
                break;
            case 'FLAGGED':
                badgeColor = 'danger';
                break;
            default:
                badgeColor = 'secondary';
        }
        
        return <Badge bg={badgeColor}>{status}</Badge>;
    };
    
    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }
    
    return (
        <Container fluid className="py-4">
            <Row className="mb-4">
                <Col>
                    <h2 className="mb-1">Review Management</h2>
                    <p className="text-muted">Monitor and moderate user reviews</p>
                </Col>
            </Row>
            
            {notificationMessage && (
                <Alert 
                    variant={notificationType} 
                    dismissible 
                    onClose={() => setNotificationMessage('')}
                    className="mb-4"
                >
                    {notificationMessage}
                </Alert>
            )}
            
            <Card className="mb-4">
                <Card.Header>
                    <Row className="align-items-center">
                        <Col md={4}>
                            <div className="d-flex align-items-center">
                                <Filter size={18} className="me-2 text-primary" />
                                <span className="fw-medium">Filters</span>
                            </div>
                        </Col>
                        <Col md={8}>
                            <div className="d-flex gap-3 justify-content-md-end">
                                <Form.Group className="mb-0" style={{ minWidth: '200px' }}>
                                    <Form.Select 
                                        size="sm" 
                                        value={selectedMovie}
                                        onChange={(e) => setSelectedMovie(e.target.value)}
                                    >
                                        <option value="all">All Movies</option>
                                        {movies && movies.map(movie => (
                                            <option key={movie.id} value={movie.id}>{movie.title}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                                
                                <Form.Group className="mb-0" style={{ minWidth: '150px' }}>
                                    <Form.Select 
                                        size="sm" 
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="APPROVED">Approved</option>
                                        <option value="PENDING">Pending</option>
                                        <option value="REJECTED">Rejected</option>
                                        <option value="FLAGGED">Flagged</option>
                                    </Form.Select>
                                </Form.Group>
                                
                                <Form.Group className="mb-0 position-relative" style={{ minWidth: '200px' }}>
                                    <Form.Control
                                        size="sm"
                                        type="text"
                                        placeholder="Search reviews..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <Search size={14} className="position-absolute" style={{ right: '10px', top: '7px', opacity: 0.5 }} />
                                </Form.Group>
                            </div>
                        </Col>
                    </Row>
                </Card.Header>
            </Card>
            
            <Tabs defaultActiveKey="all" className="mb-4">
                <Tab eventKey="all" title={<div className="d-flex align-items-center"><Eye size={16} className="me-2" />All Reviews</div>}>
                    <Card>
                        <Card.Body className="p-0">
                            {filteredReviews().length > 0 ? (
                                <Table responsive hover className="mb-0">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Movie</th>
                                            <th>Rating</th>
                                            <th>Review</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                            <th>Reports</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredReviews().map(review => (
                                            <tr key={review.id}>
                                                <td>{review.userDisplayName || 'Anonymous'}</td>
                                                <td>{getMovieTitle(review.movieId)}</td>
                                                <td>{renderStarRating(review.rating)}</td>
                                                <td>
                                                    <div style={{ maxWidth: '300px', maxHeight: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'normal' }}>
                                                        {review.content}
                                                    </div>
                                                </td>
                                                <td>{new Date(review.createdAt).toLocaleDateString()}</td>
                                                <td>{renderStatusBadge(review.status)}</td>
                                                <td>
                                                    {review.reportCount > 0 && (
                                                        <Badge bg="danger" pill>
                                                            {review.reportCount}
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td>
                                                    <Button 
                                                        variant="outline-primary" 
                                                        size="sm"
                                                        onClick={() => handleOpenModal(review)}
                                                    >
                                                        Moderate
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            ) : (
                                <div className="text-center py-5">
                                    <p className="mb-0 text-muted">No reviews found matching your criteria</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>
                
                <Tab eventKey="flagged" title={<div className="d-flex align-items-center"><Flag size={16} className="me-2" />Flagged Reviews</div>}>
                    <Card>
                        <Card.Body className="p-0">
                            {flaggedReviews().length > 0 ? (
                                <Table responsive hover className="mb-0">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Movie</th>
                                            <th>Rating</th>
                                            <th>Review</th>
                                            <th>Reports</th>
                                            <th>Report Reasons</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {flaggedReviews().map(review => (
                                            <tr key={review.id}>
                                                <td>{review.userDisplayName || 'Anonymous'}</td>
                                                <td>{getMovieTitle(review.movieId)}</td>
                                                <td>{renderStarRating(review.rating)}</td>
                                                <td>
                                                    <div style={{ maxWidth: '250px', maxHeight: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'normal' }}>
                                                        {review.content}
                                                    </div>
                                                </td>
                                                <td>
                                                    <Badge bg="danger" pill>
                                                        {review.reportCount || 0}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    {review.reports && review.reports.length > 0 ? (
                                                        <div style={{ maxWidth: '150px' }}>
                                                            {review.reports.slice(0, 2).map((report, index) => (
                                                                <Badge bg="secondary" className="me-1 mb-1" key={index}>
                                                                    {report.reason}
                                                                </Badge>
                                                            ))}
                                                            {review.reports.length > 2 && (
                                                                <Badge bg="secondary" pill>
                                                                    +{review.reports.length - 2}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted">No details</span>
                                                    )}
                                                </td>
                                                <td>{renderStatusBadge(review.status)}</td>
                                                <td>
                                                    <Button 
                                                        variant="outline-primary" 
                                                        size="sm"
                                                        onClick={() => handleOpenModal(review)}
                                                    >
                                                        Moderate
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            ) : (
                                <div className="text-center py-5">
                                    <AlertTriangle size={48} className="text-muted mb-3" />
                                    <p className="mb-0 text-muted">No flagged reviews found</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>
            
            {/* Moderation Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Review Moderation</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedReview && (
                        <>
                            <div className="mb-3">
                                <div className="text-muted mb-1">User</div>
                                <div className="fw-medium">{selectedReview.userDisplayName || 'Anonymous'}</div>
                            </div>
                            
                            <div className="mb-3">
                                <div className="text-muted mb-1">Movie</div>
                                <div className="fw-medium">{getMovieTitle(selectedReview.movieId)}</div>
                            </div>
                            
                            <div className="mb-3">
                                <div className="text-muted mb-1">Rating</div>
                                <div>{renderStarRating(selectedReview.rating)}</div>
                            </div>
                            
                            <div className="mb-3">
                                <div className="text-muted mb-1">Review Content</div>
                                <Card className="bg-light">
                                    <Card.Body className="py-2">
                                        {selectedReview.content}
                                    </Card.Body>
                                </Card>
                            </div>
                            
                            {selectedReview.reports && selectedReview.reports.length > 0 && (
                                <div className="mb-3">
                                    <div className="text-muted mb-1">Report Reasons</div>
                                    <div>
                                        {selectedReview.reports.map((report, index) => (
                                            <div key={index} className="mb-1">
                                                <Badge bg="danger" className="me-2">{report.reason}</Badge>
                                                <small className="text-muted">{new Date(report.reportedAt).toLocaleString()}</small>
                                                {report.additionalDetails && (
                                                    <p className="small text-muted mt-1 mb-2">{report.additionalDetails}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            <Form.Group className="mb-3">
                                <Form.Label>Moderation Status</Form.Label>
                                <Form.Select 
                                    value={moderationStatus}
                                    onChange={(e) => setModerationStatus(e.target.value)}
                                >
                                    <option value="APPROVED">Approved</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="REJECTED">Rejected</option>
                                </Form.Select>
                            </Form.Group>
                            
                            <Form.Group className="mb-3">
                                <Form.Label>Moderation Notes</Form.Label>
                                <Form.Control 
                                    as="textarea" 
                                    rows={3}
                                    value={moderationNote}
                                    onChange={(e) => setModerationNote(e.target.value)}
                                    placeholder="Add notes about why this review was approved or rejected..."
                                />
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Cancel
                    </Button>
                    <Button 
                        variant={moderationStatus === 'APPROVED' ? 'success' : 
                                 moderationStatus === 'REJECTED' ? 'danger' : 'warning'}
                        onClick={handleModerateReview}
                    >
                        {moderationStatus === 'APPROVED' ? (
                            <>
                                <CheckCircle size={16} className="me-1" />
                                Approve
                            </>
                        ) : moderationStatus === 'REJECTED' ? (
                            <>
                                <XCircle size={16} className="me-1" />
                                Reject
                            </>
                        ) : (
                            <>
                                <AlertTriangle size={16} className="me-1" />
                                Mark as Pending
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}

export default Reviews;