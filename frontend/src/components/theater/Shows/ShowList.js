import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Edit, Trash2, Plus, Search, Calendar, Filter } from 'lucide-react';
import { getShowsByTheater, deleteShow } from '../../../redux/slices/showSlice';
import { fetchTheaterById } from '../../../redux/slices/theaterSlice';
import { toast } from 'react-toastify';

const TheaterShows = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showsByTheater, isLoading, error } = useSelector(state => state.shows);
  const { currentTheater } = useSelector(state => state.theater);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateString, setDateString] = useState(formatDateForInput(new Date()));
  const [filters, setFilters] = useState({
    language: '',
    experience: '',
  });
  
  // Format date for HTML date input
  function formatDateForInput(date) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }
  
  // Format time for display
  function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // Format date for display
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  // Get theater ID from localStorage
  const theaterId = localStorage.getItem('theaterId');

  // Fetch theater details and shows when component mounts
  useEffect(() => {
    if (theaterId) {
      dispatch(fetchTheaterById(theaterId));
      dispatch(getShowsByTheater(theaterId));
    }
  }, [dispatch, theaterId]);

  const handleAddShow = () => {
    navigate('/manager/shows/add');
  };

  const handleDelete = (showId) => {
    if (window.confirm('Are you sure you want to delete this show?')) {
      dispatch(deleteShow(showId))
        .unwrap()
        .then(() => {
          toast.success('Show deleted successfully');
          // Refresh the shows list
          dispatch(getShowsByTheater(theaterId));
        })
        .catch((err) => {
          toast.error(`Failed to delete show: ${err}`);
        });
    }
  };

  const handleEditShow = (showId) => {
    navigate(`/manager/shows/edit/${showId}`);
  };

  // Filter shows by date, search term, and other filters
  const filteredShows = showsByTheater.filter(show => {
    const showDate = new Date(show.showTime);
    const selected = new Date(selectedDate);
    
    // Compare year, month, and day
    const isSameDay = 
      showDate.getFullYear() === selected.getFullYear() &&
      showDate.getMonth() === selected.getMonth() &&
      showDate.getDate() === selected.getDate();
    
    // For search, handle undefined or null movie title
    const movieTitle = show.movie?.title || '';
    const matchesSearch = movieTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLanguage = !filters.language || show.language === filters.language;
    const matchesExperience = !filters.experience || show.experience === filters.experience;

    return isSameDay && matchesSearch && matchesLanguage && matchesExperience;
  });

  // Get unique values for filters
  const languages = [...new Set(showsByTheater.map(show => show.language))].filter(Boolean);
  const experiences = [...new Set(showsByTheater.map(show => show.experience))].filter(Boolean);

  // Sort shows by time
  const sortedShows = [...filteredShows].sort((a, b) => new Date(a.showTime) - new Date(b.showTime));

  if (isLoading) {
    return (
      <Container fluid className="py-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container fluid className="py-4">
        <div className="alert alert-danger" role="alert">
          Error loading shows: {error}
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Card>
        <Card.Header className="bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            {currentTheater ? `Shows - ${currentTheater.name}` : 'Show Schedule'}
          </h5>
          <Button 
            variant="primary" 
            onClick={handleAddShow}
            className="d-flex align-items-center gap-2"
          >
            <Plus size={18} />
            Add Show
          </Button>
        </Card.Header>

        <Card.Body>
          <Row className="mb-4 g-3">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  <Search size={18} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search movies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <InputGroup>
                <InputGroup.Text>
                  <Calendar size={18} />
                </InputGroup.Text>
                <Form.Control
                  type="date"
                  value={dateString}
                  onChange={(e) => {
                    setDateString(e.target.value);
                    setSelectedDate(new Date(e.target.value));
                  }}
                />
              </InputGroup>
            </Col>
            <Col md={2}>
              <Form.Select
                value={filters.language}
                onChange={(e) => setFilters({...filters, language: e.target.value})}
              >
                <option value="">All Languages</option>
                {languages.map(language => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                value={filters.experience}
                onChange={(e) => setFilters({...filters, experience: e.target.value})}
              >
                <option value="">All Experiences</option>
                {experiences.map(experience => (
                  <option key={experience} value={experience}>
                    {experience}
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>

          <Table responsive hover>
            <thead>
              <tr>
                <th>Movie</th>
                <th>Time</th>
                <th>Screen</th>
                <th>Language</th>
                <th>Experience</th>
                <th>Status</th>
                <th>Available Seats</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedShows.map(show => (
                <tr key={show.id}>
                  <td>
                    <div className="d-flex align-items-center">
                      {show.movie?.posterUrl && (
                        <img 
                          src={show.movie.posterUrl} 
                          alt={show.movie?.title} 
                          style={{ width: '40px', height: '60px', objectFit: 'cover', marginRight: '10px' }} 
                        />
                      )}
                      <div>
                        <div>{show.movie?.title}</div>
                        {show.movie?.duration && (
                          <small className="text-muted">
                            {Math.floor(show.movie.duration / 60)}h {show.movie.duration % 60}m
                          </small>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="fw-bold">
                      {formatTime(show.showTime)}
                    </div>
                  </td>
                  <td>
                    {currentTheater?.screens?.find(s => s.screenNumber === show.screenNumber)?.screenName || `Screen ${show.screenNumber}`}
                  </td>
                  <td>{show.language}</td>
                  <td>
                    <Badge bg="info">{show.experience}</Badge>
                  </td>
                  <td>
                    <Badge 
                      bg={
                        show.status === 'OPEN' ? 'success' : 
                        show.status === 'SOLDOUT' ? 'danger' : 
                        show.status === 'FEWSEATSLEFT' ? 'warning' : 
                        show.status === 'FILLINGFAST' ? 'primary' : 
                        'secondary'
                      }
                    >
                      {show.status === 'FEWSEATSLEFT' ? 'FEW SEATS LEFT' : 
                       show.status === 'FILLINGFAST' ? 'FILLING FAST' : 
                       show.status}
                    </Badge>
                  </td>
                  <td>
                    {show.availableSeats !== undefined && show.totalSeats !== undefined ? (
                      <div>
                        {show.availableSeats} / {show.totalSeats}
                        <div className="progress mt-1" style={{ height: '6px' }}>
                          <div 
                            className="progress-bar" 
                            role="progressbar" 
                            style={{ width: `${(show.availableSeats / show.totalSeats) * 100}%` }}
                            aria-valuenow={(show.availableSeats / show.totalSeats) * 100}
                            aria-valuemin="0" 
                            aria-valuemax="100"
                          ></div>
                        </div>
                      </div>
                    ) : '-'}
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => handleEditShow(show.id)}
                        title="Edit Show"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDelete(show.id)}
                        title="Delete Show"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {sortedShows.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    <div className="text-muted">
                      No shows scheduled for {formatDate(selectedDate)}
                    </div>
                    <Button 
                      variant="primary" 
                      className="mt-3"
                      onClick={handleAddShow}
                    >
                      Schedule a Show
                    </Button>
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

export default TheaterShows;