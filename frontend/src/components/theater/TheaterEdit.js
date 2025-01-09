import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Row, Col, Alert, Tab, Nav } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { updateTheater } from '../../redux/slices/theaterSlice';
import { Building, MapPin, Phone, Mail, Info, Settings } from 'lucide-react';

const TheaterEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theaters = useSelector(state => state.theater.theaters);

  const [showSuccess, setShowSuccess] = useState(false);
  const [validated, setValidated] = useState(false);
  const [theaterData, setTheaterData] = useState({
    name: '',
    description: '',
    totalScreens: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    contact: {
      email: '',
      phone: '',
      website: ''
    },
    amenities: [],
    status: 'ACTIVE'
  });

  const amenitiesList = [
    'Parking',
    'Food Court',
    'Wheelchair Access',
    'Dolby Sound',
    'IMAX',
    '4K Projection',
    'VIP Lounge',
    'Online Booking'
  ];

  useEffect(() => {
    const theater = theaters.find(t => t.id.toString() === id);
    if (theater) {
      setTheaterData(theater);
    }
  }, [id, theaters]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    try {
      dispatch(updateTheater({ id, ...theaterData }));
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate('/manager/theaters');
      }, 2000);
    } catch (error) {
      console.error('Error updating theater:', error);
    }
  };

  const handleAmenityToggle = (amenity) => {
    setTheaterData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  return (
    <Container fluid className="py-4">
      {showSuccess && (
        <Alert variant="success" className="mb-4">
          Theater details updated successfully! Redirecting...
        </Alert>
      )}

      <Card>
        <Card.Header>
          <h5 className="mb-0">Edit Theater - {theaterData.name}</h5>
        </Card.Header>
        <Card.Body>
          <Tab.Container defaultActiveKey="basic">
            <Row>
              <Col md={3}>
                <Nav variant="pills" className="flex-column">
                  <Nav.Item>
                    <Nav.Link eventKey="basic" className="d-flex align-items-center gap-2">
                      <Building size={18} />
                      Basic Details
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="location" className="d-flex align-items-center gap-2">
                      <MapPin size={18} />
                      Location
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="contact" className="d-flex align-items-center gap-2">
                      <Phone size={18} />
                      Contact
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="amenities" className="d-flex align-items-center gap-2">
                      <Settings size={18} />
                      Amenities
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Col>
              <Col md={9}>
                <Tab.Content>
                  <Tab.Pane eventKey="basic">
                    <Form.Group className="mb-3">
                      <Form.Label>Theater Name</Form.Label>
                      <Form.Control
                        required
                        type="text"
                        value={theaterData.name}
                        onChange={e => setTheaterData({...theaterData, name: e.target.value})}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={theaterData.description}
                        onChange={e => setTheaterData({...theaterData, description: e.target.value})}
                      />
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Total Screens</Form.Label>
                          <Form.Control
                            required
                            type="number"
                            min="1"
                            value={theaterData.totalScreens}
                            onChange={e => setTheaterData({...theaterData, totalScreens: e.target.value})}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Status</Form.Label>
                          <Form.Select
                            value={theaterData.status}
                            onChange={e => setTheaterData({...theaterData, status: e.target.value})}
                          >
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Tab.Pane>

                  <Tab.Pane eventKey="location">
                    <Form.Group className="mb-3">
                      <Form.Label>Address</Form.Label>
                      <Form.Control
                        required
                        type="text"
                        value={theaterData.address}
                        onChange={e => setTheaterData({...theaterData, address: e.target.value})}
                      />
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>City</Form.Label>
                          <Form.Control
                            required
                            type="text"
                            value={theaterData.city}
                            onChange={e => setTheaterData({...theaterData, city: e.target.value})}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>State</Form.Label>
                          <Form.Control
                            required
                            type="text"
                            value={theaterData.state}
                            onChange={e => setTheaterData({...theaterData, state: e.target.value})}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>ZIP Code</Form.Label>
                          <Form.Control
                            required
                            type="text"
                            value={theaterData.zipCode}
                            onChange={e => setTheaterData({...theaterData, zipCode: e.target.value})}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Tab.Pane>

                  <Tab.Pane eventKey="contact">
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control
                            type="email"
                            value={theaterData.contact?.email}
                            onChange={e => setTheaterData({
                              ...theaterData,
                              contact: { ...theaterData.contact, email: e.target.value }
                            })}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Phone</Form.Label>
                          <Form.Control
                            type="tel"
                            value={theaterData.contact?.phone}
                            onChange={e => setTheaterData({
                              ...theaterData,
                              contact: { ...theaterData.contact, phone: e.target.value }
                            })}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Website</Form.Label>
                      <Form.Control
                        type="url"
                        value={theaterData.contact?.website}
                        onChange={e => setTheaterData({
                          ...theaterData,
                          contact: { ...theaterData.contact, website: e.target.value }
                        })}
                      />
                    </Form.Group>
                  </Tab.Pane>

                  <Tab.Pane eventKey="amenities">
                    <div className="d-flex flex-wrap gap-3">
                      {amenitiesList.map(amenity => (
                        <Button
                          key={amenity}
                          variant={theaterData.amenities.includes(amenity) ? 'primary' : 'outline-primary'}
                          onClick={() => handleAmenityToggle(amenity)}
                          className="d-flex align-items-center gap-2"
                        >
                          <Settings size={16} />
                          {amenity}
                        </Button>
                      ))}
                    </div>
                  </Tab.Pane>
                </Tab.Content>
              </Col>
            </Row>
          </Tab.Container>

          <div className="d-flex gap-2 mt-4">
            <Button variant="primary" onClick={handleSubmit}>
              Save Changes
            </Button>
            <Button variant="outline-secondary" onClick={() => navigate('/manager/theaters')}>
              Cancel
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TheaterEdit;