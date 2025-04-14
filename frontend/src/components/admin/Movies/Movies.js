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
  Alert
} from 'react-bootstrap';
import { 
  Plus, 
  Search, 
  Edit, 
  Film,
  Calendar,
  Clock,
  Globe,
  Users
} from 'lucide-react';
import { fetchMovies, selectMovies, setCurrentMovie } from '../../../redux/slices/adminSlice';
import './Movies.css';

function Movies() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { data: movies, loading, error } = useSelector(selectMovies);
    const [filteredMovies, setFilteredMovies] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        dispatch(fetchMovies());
    }, [dispatch]);

    useEffect(() => {
        if (movies) {
            handleSearch(searchTerm);
        }
    }, [searchTerm, movies]);

    const handleSearch = (value) => {
        if (!movies) return;
        
        const searchValue = value.toLowerCase().trim();
        if (!searchValue) {
            setFilteredMovies(movies);
            return;
        }
        
        const filtered = movies.filter(movie => 
            movie.title?.toLowerCase().includes(searchValue) ||
            movie.languages?.some(lang => lang.toLowerCase().includes(searchValue)) ||
            movie.genres?.some(genre => genre.toLowerCase().includes(searchValue)) ||
            movie.cast?.some(actor => actor.name?.toLowerCase().includes(searchValue))
        );
        setFilteredMovies(filtered);
    };

    const handleAddMovie = () => {
        navigate('/admin/movies/add');
    };
    
    const handleEditMovie = (movieId) => {
        const movieToEdit = movies.find(movie => movie.id === movieId);
        if (movieToEdit) {
            dispatch(setCurrentMovie(movieToEdit));
            navigate(`/admin/movies/edit/${movieId}`);
        }
    };

    const renderCast = (cast) => {
        if (!cast || cast.length === 0) return 'No cast information';
        return cast.slice(0, 3).map(actor => actor.name).join(', ') + 
               (cast.length > 3 ? ` + ${cast.length - 3} more` : '');
    };

    const renderStatus = (status) => {
        const statusMap = {
            UPCOMING: { variant: 'warning', label: 'Upcoming' },
            RELEASED: { variant: 'success', label: 'Released' }
        };
        
        const statusInfo = statusMap[status] || { variant: 'secondary', label: status };
        
        return (
            <Badge bg={statusInfo.variant} className="status-badge">
                {statusInfo.label}
            </Badge>
        );
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" role="status" variant="primary">
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

    return (
        <Container fluid className="movies-container py-4">
            <Card className="shadow-sm border-0">
                <Card.Body>
                    <Row className="mb-4 align-items-center">
                        <Col xs={12} md={6}>
                            <h2 className="mb-0 fw-bold">
                                <Film className="me-2" size={24} />
                                Movies
                            </h2>
                        </Col>
                        <Col xs={12} md={6}>
                            <div className="d-flex flex-column flex-md-row gap-2 mt-3 mt-md-0 justify-content-md-end">
                                <div className="search-container position-relative flex-grow-1 me-md-2">
                                    <Search className="search-icon position-absolute" size={18} style={{ left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                                    <Form.Control
                                        type="text"
                                        placeholder="Search movies..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="ps-4"
                                    />
                                </div>
                                <Button 
                                    variant="primary"
                                    onClick={handleAddMovie}
                                    className="d-flex align-items-center"
                                >
                                    <Plus size={18} className="me-1" />
                                    <span>Add Movie</span>
                                </Button>
                            </div>
                        </Col>
                    </Row>

                    <div className="table-responsive">
                        <Table hover className="movies-table align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Movie</th>
                                    <th><Globe size={16} className="me-1" /> Languages</th>
                                    <th><Users size={16} className="me-1" /> Cast</th>
                                    <th><Clock size={16} className="me-1" /> Duration</th>
                                    <th><Calendar size={16} className="me-1" /> Released</th>
                                    <th>Status</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMovies?.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-4 text-muted">
                                            No movies found matching your search.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMovies?.map((movie) => (
                                        <tr key={movie.id}>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    {movie.posterUrl ? (
                                                        <div className="movie-poster-container me-3">
                                                            <img 
                                                                src={movie.posterUrl}
                                                                alt={`${movie.title} poster`}
                                                                className="movie-poster shadow-sm"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="movie-poster-placeholder me-3">
                                                            <Film size={24} />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="fw-bold">{movie.title}</div>
                                                        <div className="small text-muted">
                                                            {movie.genres?.slice(0, 2).join(', ')}
                                                            {movie.genres?.length > 2 ? '...' : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{movie.languages?.join(', ') || 'N/A'}</td>
                                            <td>{renderCast(movie.cast)}</td>
                                            <td>{movie.duration} mins</td>
                                            <td>{movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString() : 'N/A'}</td>
                                            <td>{renderStatus(movie.status)}</td>
                                            <td className="text-end">
                                                <Button 
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() => handleEditMovie(movie.id)}
                                                    className="d-flex align-items-center ms-auto"
                                                >
                                                    <Edit size={16} className="me-1" />
                                                    <span className="d-none d-md-inline">Edit</span>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
}

export default Movies;