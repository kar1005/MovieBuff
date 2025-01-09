import React, { useState } from 'react';
import { Container, Card, Form, Button, Row, Col, Table, Alert } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { addShow, updateShow, deleteShow } from '../../redux/slices/theaterSlice';
import { Film, Trash2, Edit } from 'lucide-react';

const ShowSchedule = () => {
  const dispatch = useDispatch();
  const theaters = useSelector(state => state.theater.theaters);
  const shows = useSelector(state => state.theater.shows);
  
  const [editMode, setEditMode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedShow, setSelectedShow] = useState(null);
  const initialFormState = {
    theaterId: '',
    movieId: '',
    screenNumber: '',
    showTime: '',
    language: '',
    experience: '',
    pricing: {
      PREMIUM: 0,
      GOLD: 0,
      SILVER: 0
    }
  };
  const [showForm, setShowForm] = useState(initialFormState);

  // Mock movie data (replace with API call)
  const movies = [
    { id: 1, title: 'Inception', languages: ['English', 'Hindi'] },
    { id: 2, title: 'Avatar', languages: ['English', 'Hindi', 'Tamil'] },
  ];

  const experiences = ['2D', '3D', 'IMAX', '4DX', 'Dolby'];

  const resetForm = () => {
    setEditMode(false);
    setSelectedShow(null);
    setShowForm(initialFormState);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        dispatch(updateShow({ ...selectedShow, ...showForm }));
      } else {
        dispatch(addShow({ id: Date.now(), ...showForm }));
      }
      
      setShowSuccess(true);
      resetForm();
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving show:', error);
    }
  };

  const handleEdit = (show) => {
    setEditMode(true);
    setSelectedShow(show);
    setShowForm({
      theaterId: show.theaterId,
      movieId: show.movieId,
      screenNumber: show.screenNumber,
      showTime: show.showTime,
      language: show.language,
      experience: show.experience,
      pricing: show.pricing
    });
  };

  const handleDelete = (showId) => {
    if (window.confirm('Are you sure you want to delete this show?')) {
      dispatch(deleteShow(showId));
    }
  };

  return (
    <Container fluid className="py-4">
      {showSuccess && (
        <Alert variant="success" className="mb-4">
          Show {editMode ? 'updated' : 'added'} successfully!
        </Alert>
      )}

      <Row>
        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">{editMode ? 'Edit Show' : 'Add New Show'}</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Select Theater</Form.Label>
                  <Form.Select
                    value={showForm.theaterId}
                    onChange={(e) => setShowForm({ ...showForm, theaterId: e.target.value })}
                    required
                  >
                    <option value="">Choose theater...</option>
                    {theaters.map(theater => (
                      <option key={theater.id} value={theater.id}>
                        {theater.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {/* Rest of the form remains the same */}

                <div className="d-flex gap-2">
                  <Button variant="primary" type="submit">
                    {editMode ? 'Update Show' : 'Add Show'}
                  </Button>
                  {editMode && (
                    <Button variant="secondary" onClick={resetForm}>
                      Cancel
                    </Button>
                  )}
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Show List</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Movie</th>
                    <th>Theater</th>
                    <th>Screen</th>
                    <th>Time</th>
                    <th>Language</th>
                    <th>Experience</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shows.map(show => (
                    <tr key={show.id}>
                      <td>{movies.find(m => m.id === show.movieId)?.title}</td>
                      <td>{theaters.find(t => t.id === show.theaterId)?.name}</td>
                      <td>Screen {show.screenNumber}</td>
                      <td>{new Date(show.showTime).toLocaleString()}</td>
                      <td>{show.language}</td>
                      <td>{show.experience}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => handleEdit(show)}
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
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ShowSchedule;