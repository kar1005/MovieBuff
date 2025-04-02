import React, { useState } from 'react';
import { Container, Card, Table, Button, Badge, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Edit, Trash2, Plus, Search, Calendar, Filter } from 'lucide-react';
import { deleteShow } from '../../../redux/slices/theaterSlice';

const ShowList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const shows = useSelector(state => state.theater.shows);
  const theaters = useSelector(state => state.theater.theaters);
  const theaterId = localStorage.getItem('theaterId');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    theater: '',
    language: '',
    experience: '',
    date: '',
  });

  const handleDelete = (showId) => {
    if (window.confirm('Are you sure you want to delete this show?')) {
      dispatch(deleteShow(showId));
    }
  };

  const filteredShows = shows.filter(show => {
    const matchesSearch = 
      show.movieTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTheater = !filters.theater || show.theaterId === filters.theater;
    const matchesLanguage = !filters.language || show.language === filters.language;
    const matchesExperience = !filters.experience || show.experience === filters.experience;
    const matchesDate = !filters.date || new Date(show.showTime).toLocaleDateString() === new Date(filters.date).toLocaleDateString();

    return matchesSearch && matchesTheater && matchesLanguage && matchesExperience && matchesDate;
  });

  // Get unique values for filters
  const languages = [...new Set(shows.map(show => show.language))];
  const experiences = [...new Set(shows.map(show => show.experience))];

  return (
    <Container fluid className="py-4">
      <Card>
        <Card.Header className="bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Show Schedule</h5>
          <Button 
            variant="primary" 
            onClick={() => navigate('/manager/schedule')}
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
            <Col md={2}>
              <Form.Select
                value={filters.theater}
                onChange={(e) => setFilters({...filters, theater: e.target.value})}
              >
                <option value="">All Theaters</option>
                {theaters.map(theater => (
                  <option key={theater.id} value={theater.id}>
                    {theater.name}
                  </option>
                ))}
              </Form.Select>
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
            <Col md={2}>
              <Form.Control
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({...filters, date: e.target.value})}
              />
            </Col>
          </Row>

          <Table responsive hover>
            <thead>
              <tr>
                <th>Movie</th>
                <th>Theater</th>
                <th>Screen</th>
                <th>Date & Time</th>
                <th>Language</th>
                <th>Experience</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredShows.map(show => (
                <tr key={show.id}>
                  <td>{show.movieTitle}</td>
                  <td>{theaters.find(t => t.id === show.theaterId)?.name}</td>
                  <td>Screen {show.screenNumber}</td>
                  <td>
                    <div>{new Date(show.showTime).toLocaleDateString()}</div>
                    <small className="text-muted">
                      {new Date(show.showTime).toLocaleTimeString()}
                    </small>
                  </td>
                  <td>{show.language}</td>
                  <td>
                    <Badge bg="info">{show.experience}</Badge>
                  </td>
                  <td>
                    <Badge 
                      bg={show.status === 'OPEN' ? 'success' : show.status === 'FULL' ? 'warning' : 'danger'}
                    >
                      {show.status}
                    </Badge>
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => navigate(`/manager/schedule?edit=${show.id}`)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDelete(show.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredShows.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    <div className="text-muted">
                      No shows found matching your search criteria
                    </div>
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

export default ShowList;