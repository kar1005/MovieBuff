import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Form, InputGroup, Row, Col, Tabs, Tab } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Edit, Trash2, Plus, Search, Calendar, Clock, Film, Check, MonitorPause, Filter, AlertCircle } from 'lucide-react';
import { 
  getShowsByTheater, 
  deleteShow, 
  getShowsByTheaterAndDate,
  refreshShowStatus
} from '../../../redux/slices/showSlice';
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
    screenNumber: ''
  });
  const [activeTab, setActiveTab] = useState('upcoming');
  
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

  // Check if a show is past (already finished)
  function isPastShow(show) {
    const now = new Date();
    const endTime = new Date(show.endTime);
    return endTime < now;
  }

  // Check if a show is currently running
  function isRunningShow(show) {
    const now = new Date();
    const startTime = new Date(show.showTime);
    const endTime = new Date(show.endTime);
    return startTime <= now && now <= endTime;
  }

  // Function to refresh status of all shows
  const refreshAllShowStatuses = () => {
    // Only refresh non-finished shows for performance
    const showsToRefresh = showsByTheater.filter(show => 
      show.status !== 'FINISHED' && show.status !== 'CANCELLED'
    );
    
    // Create a promise array to track all refresh operations
    const refreshPromises = showsToRefresh.map(show => 
      dispatch(refreshShowStatus(show.id))
    );
    
    // If needed, you can wait for all to complete
    Promise.all(refreshPromises)
      .then(() => console.log("All show statuses refreshed"))
      .catch(error => console.error("Error refreshing show statuses:", error));
  };

  // Get theater ID from localStorage
  const theaterId = localStorage.getItem('theaterId');

  // Fetch theater details and shows when component mounts
  useEffect(() => {
    if (theaterId) {
      dispatch(fetchTheaterById(theaterId));
      const today = new Date();
      const formattedDate = formatDateForInput(today);
      dispatch(getShowsByTheaterAndDate({ 
        theaterId, 
        date: formattedDate
      }));
    }
  }, [dispatch, theaterId]);

  // Refresh show statuses periodically and when tab or shows change
  useEffect(() => {
    // Initial refresh when shows are loaded
    if (showsByTheater.length > 0) {
      refreshAllShowStatuses();
    }
    
    // Periodic refresh every 1 minute to ensure statuses stay current
    const intervalId = setInterval(() => {
      if (showsByTheater.length > 0) {
        refreshAllShowStatuses();
      }
    }, 60000); // 1 minute interval
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [showsByTheater.length, activeTab]); // Re-run if show count or active tab changes
  
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setDateString(newDate);
    setSelectedDate(new Date(newDate));
    
    // Fetch shows for the new date
    if (theaterId) {
      dispatch(getShowsByTheaterAndDate({ 
        theaterId, 
        date: newDate
      }));
    }
  };
  
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
        .catch((error) => {
          // Enhanced error handling
          console.error("Error deleting show:", error);
          let errorMessage = 'Failed to delete show';
          
          try {
            if (error && typeof error === 'object') {
              if (error.message) {
                errorMessage = error.message;
              } else if (error.data && error.data.message) {
                errorMessage = error.data.message;
              } else if (error.toString && typeof error.toString === 'function') {
                const errorString = error.toString();
                errorMessage = errorString !== '[object Object]' ? errorString : 'Server error occurred';
              } else {
                errorMessage = JSON.stringify(error);
              }
            } else if (typeof error === 'string') {
              errorMessage = error;
            }
          } catch (e) {
            errorMessage = "An unknown error occurred";
          }
          
          toast.error(errorMessage);
        });
    }
  };

  const handleEditShow = (showId) => {
    navigate(`/manager/shows/edit/${showId}`);
  };

  // Filter shows by date, search term, and other filters
  const filteredShows = showsByTheater.filter(show => {
    // Only filter by date - we'll separate past and upcoming shows in the UI
    const showDate = new Date(show.showTime);
    const selected = new Date(selectedDate);
    
    // Compare year, month, and day
    const isSameDay = 
      showDate.getFullYear() === selected.getFullYear() &&
      showDate.getMonth() === selected.getMonth() &&
      showDate.getDate() === selected.getDate();
    
    // Search filter
    const movieTitle = show.movie?.title || '';
    const matchesSearch = movieTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Other filters
    const matchesLanguage = !filters.language || show.language === filters.language;
    const matchesExperience = !filters.experience || show.experience === filters.experience;
    const matchesScreen = !filters.screenNumber || show.screenNumber.toString() === filters.screenNumber;

    return isSameDay && matchesSearch && matchesLanguage && matchesExperience && matchesScreen;
  });

  // Split shows into past, running, and upcoming for the tabbed interface
  const pastShows = filteredShows.filter(show => isPastShow(show));
  const runningShows = filteredShows.filter(show => isRunningShow(show));
  const upcomingShows = filteredShows.filter(show => !isPastShow(show) && !isRunningShow(show));

  // Get shows based on active tab
  const getActiveShows = () => {
    switch(activeTab) {
      case 'past':
        return pastShows;
      case 'running':
        return runningShows;
      case 'upcoming':
        return upcomingShows;
      case 'all':
        return filteredShows;
      default:
        return upcomingShows;
    }
  };

  // Get unique values for filters
  const languages = [...new Set(showsByTheater.map(show => show.language))].filter(Boolean);
  const experiences = [...new Set(showsByTheater.map(show => show.experience))].filter(Boolean);
  const screenNumbers = [...new Set(showsByTheater.map(show => show.screenNumber))].filter(Boolean);

  // Sort shows by time
  const sortedShows = [...getActiveShows()].sort((a, b) => new Date(a.showTime) - new Date(b.showTime));

  // Format date for the title
  const formattedDate = formatDate(selectedDate);

  if (isLoading) {
    return (
      <Container fluid className="py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading shows...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container fluid className="py-4">
        <Card className="shadow-sm border-0">
          <Card.Body className="p-5 text-center">
            <AlertCircle size={48} className="text-danger mb-3" />
            <h5 className="mb-3">Error Loading Shows</h5>
            <p className="text-muted">{error}</p>
            <Button 
              variant="primary" 
              onClick={() => dispatch(getShowsByTheater(theaterId))}
              className="mt-3"
            >
              Retry
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-white d-flex flex-column flex-md-row justify-content-between align-items-md-center py-3 gap-3">
          <div>
            <h5 className="mb-0 text-primary">
              {currentTheater ? `Shows - ${currentTheater.name}` : 'Show Schedule'}
            </h5>
            <p className="text-muted mb-0 mt-1 small">
              {formattedDate}
            </p>
          </div>
          <Button 
            variant="primary" 
            onClick={handleAddShow}
            className="d-flex align-items-center gap-2"
          >
            <Plus size={18} />
            Schedule New Show
          </Button>
        </Card.Header>

        <div className="p-3 bg-light border-top border-bottom">
          <Row className="g-3">
            <Col md={4} sm={6}>
              <InputGroup className="shadow-sm">
                <InputGroup.Text className="bg-white border-end-0">
                  <Search size={18} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search movies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-start-0"
                />
              </InputGroup>
            </Col>
            <Col md={2} sm={6}>
              <InputGroup className="shadow-sm">
                <InputGroup.Text className="bg-white border-end-0">
                  <Calendar size={18} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  type="date"
                  value={dateString}
                  onChange={handleDateChange}
                  className="border-start-0"
                />
              </InputGroup>
            </Col>
            <Col md={2} sm={4}>
              <Form.Select
                value={filters.language}
                onChange={(e) => setFilters({...filters, language: e.target.value})}
                className="shadow-sm"
              >
                <option value="">All Languages</option>
                {languages.map(language => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2} sm={4}>
              <Form.Select
                value={filters.experience}
                onChange={(e) => setFilters({...filters, experience: e.target.value})}
                className="shadow-sm"
              >
                <option value="">All Experiences</option>
                {experiences.map(experience => (
                  <option key={experience} value={experience}>
                    {experience}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2} sm={4}>
              <Form.Select
                value={filters.screenNumber}
                onChange={(e) => setFilters({...filters, screenNumber: e.target.value})}
                className="shadow-sm"
              >
                <option value="">All Screens</option>
                {screenNumbers.map(screenNumber => (
                  <option key={screenNumber} value={screenNumber}>
                    {currentTheater?.screens?.find(s => s.screenNumber === screenNumber)?.screenName || `Screen ${screenNumber}`}
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </div>

        <Card.Body className="p-0">
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3 px-3 pt-3"
            fill
          >
            <Tab eventKey="upcoming" title={
              <span className="d-flex align-items-center gap-1">
                <Clock size={16} />
                Upcoming ({upcomingShows.length})
              </span>
            } />
            <Tab eventKey="running" title={
              <span className="d-flex align-items-center gap-1">
                <MonitorPause size={16} className="text-success" />
                Now Playing ({runningShows.length})
              </span>
            } />
            <Tab eventKey="past" title={
              <span className="d-flex align-items-center gap-1">
                <Check size={16} />
                Completed ({pastShows.length})
              </span>
            } />
            <Tab eventKey="all" title={
              <span className="d-flex align-items-center gap-1">
                <Film size={16} />
                All Shows ({filteredShows.length})
              </span>
            } />
          </Tabs>

          <div className="px-3 pb-3">
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead className="bg-light">
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
                  {sortedShows.map(show => {
                    const isPast = isPastShow(show);
                    const isRunning = isRunningShow(show);
                    
                    return (
                      <tr key={show.id} className={isPast ? 'text-muted' : ''}>
                        <td>
                          <div className="d-flex align-items-center">
                            {show.movie?.posterUrl && (
                              <img 
                                src={show.movie.posterUrl} 
                                alt={show.movie?.title} 
                                className="rounded shadow-sm me-3" 
                                style={{ width: '40px', height: '60px', objectFit: 'cover' }} 
                              />
                            )}
                            <div>
                              <div className={isPast ? '' : 'fw-medium'}>{show.movie?.title}</div>
                              {show.movie?.duration && (
                                <small className="text-muted">
                                  {Math.floor(show.movie.duration / 60)}h {show.movie.duration % 60}m
                                </small>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={`${isPast ? '' : 'fw-semibold'} d-flex flex-column`}>
                            <span>{formatTime(show.showTime)}</span>
                            <small className="text-muted">to {formatTime(show.endTime)}</small>
                          </div>
                        </td>
                        <td>
                          <Badge bg="light" text="dark" className="border">
                            {currentTheater?.screens?.find(s => s.screenNumber === show.screenNumber)?.screenName || `Screen ${show.screenNumber}`}
                          </Badge>
                        </td>
                        <td>{show.language}</td>
                        <td>
                          <Badge 
                            bg={isPast ? 'light' : 'info'} 
                            text={isPast ? 'dark' : 'white'}
                            className={isPast ? 'border' : ''}
                          >
                            {show.experience}
                          </Badge>
                        </td>
                        <td>
                          <Badge 
                            bg={
                              show.status === 'FINISHED' ? 'secondary' :
                              isRunning ? 'success' :
                              show.status === 'OPEN' ? 'primary' : 
                              show.status === 'SOLDOUT' ? 'danger' : 
                              show.status === 'FEWSEATSLEFT' ? 'warning' : 
                              show.status === 'FILLINGFAST' ? 'info' : 
                              'light'
                            }
                            text={
                              show.status === 'FINISHED' || isRunning ? 'white' :
                              show.status === 'FEWSEATSLEFT' || show.status === 'FILLINGFAST' ? 'dark' : 
                              'white'
                            }
                          >
                            {show.status === 'FINISHED' ? 'COMPLETED' : 
                             isRunning ? 'NOW PLAYING' :
                             show.status === 'FEWSEATSLEFT' ? 'FEW SEATS LEFT' : 
                             show.status === 'FILLINGFAST' ? 'FILLING FAST' : 
                             show.status}
                          </Badge>
                        </td>
                        <td>
                          {show.availableSeats !== undefined && show.totalSeats !== undefined ? (
                            <div>
                              <small>{show.availableSeats} / {show.totalSeats}</small>
                              <div className="progress mt-1" style={{ height: '6px' }}>
                                <div 
                                  className={`progress-bar ${isPast ? 'bg-secondary' : ''}`}
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
                          {!isPast ? (
                            <div className="d-flex gap-2">
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={() => handleEditShow(show.id)}
                                title="Edit Show"
                                className="d-flex align-items-center justify-content-center"
                                style={{ width: '32px', height: '32px', padding: 0 }}
                              >
                                <Edit size={16} />
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => handleDelete(show.id)}
                                title="Delete Show"
                                className="d-flex align-items-center justify-content-center"
                                style={{ width: '32px', height: '32px', padding: 0 }}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          ) : (
                            <Badge bg="light" text="dark" className="border">
                              No actions available
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {sortedShows.length === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center py-5">
                        <div className="text-muted">
                          <Film size={48} className="mb-3 opacity-50" />
                          <h6>No shows found</h6>
                          <p className="mb-4">
                            {activeTab === 'upcoming' ? 'No upcoming shows scheduled for this date.' :
                             activeTab === 'running' ? 'No shows currently playing.' :
                             activeTab === 'past' ? 'No completed shows for this date.' :
                             'No shows match your filters.'}
                          </p>
                          <Button 
                            variant="primary" 
                            onClick={handleAddShow}
                          >
                            Schedule a Show
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TheaterShows;