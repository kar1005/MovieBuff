import React, { useState } from 'react';
import { Container, Card, Table, Button, Badge, Form, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Edit, Trash2, Plus, Search, Monitor } from 'lucide-react';
import { deleteTheater } from '../../redux/slices/theaterSlice';

const TheaterList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theaters = useSelector(state => state.theater.theaters);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const handleDelete = (theaterId) => {
    if (window.confirm('Are you sure you want to delete this theater? This action cannot be undone.')) {
      dispatch(deleteTheater(theaterId));
    }
  };

  const filteredTheaters = theaters.filter(theater => {
    const matchesSearch = 
      theater.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      theater.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'ALL' || theater.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <Container fluid className="py-4">
      <Card>
        <Card.Header className="bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Theaters</h5>
          <Button 
            variant="primary" 
            onClick={() => navigate('/manager/add-theater')}
            className="d-flex align-items-center gap-2"
          >
            <Plus size={18} />
            Add Theater
          </Button>
        </Card.Header>

        <Card.Body>
          <div className="mb-4 d-flex gap-3 align-items-center">
            <InputGroup style={{ maxWidth: '300px' }}>
              <InputGroup.Text>
                <Search size={18} />
              </InputGroup.Text>
              <Form.Control
                placeholder="Search theaters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>

            <Form.Select 
              style={{ maxWidth: '150px' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Form.Select>
          </div>

          <Table responsive hover>
            <thead>
              <tr>
                <th>Name</th>
                <th>Location</th>
                <th>Screens</th>
                <th>Status</th>
                <th>Today's Shows</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTheaters.map(theater => (
                <tr key={theater.id}>
                  <td>{theater.name}</td>
                  <td>
                    <div>{theater.address}</div>
                    <small className="text-muted">
                      {theater.city}, {theater.state} {theater.zipCode}
                    </small>
                  </td>
                  <td>
                    <Badge 
                      bg="info" 
                      className="d-flex align-items-center gap-1" 
                      style={{ width: 'fit-content' }}
                    >
                      <Monitor size={14} />
                      {theater.totalScreens} Screens
                    </Badge>
                  </td>
                  <td>
                    <Badge 
                      bg={theater.status === 'ACTIVE' ? 'success' : 'warning'}
                    >
                      {theater.status}
                    </Badge>
                  </td>
                  <td>{theater.todayShows || 0} Shows</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => navigate(`/manager/theaters/${theater.id}`)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDelete(theater.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTheaters.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    <div className="text-muted">
                      No theaters found matching your search criteria
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

export default TheaterList;