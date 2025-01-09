import React, { useState } from 'react';
import { Container, Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addTheater } from '../../redux/slices/theaterSlice';

const AddTheater = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [validated, setValidated] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    totalScreens: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    try {
      // In production, this would be an API call
      const newTheater = {
        id: Date.now(), // Temporary ID for demo
        ...formData,
        status: 'ACTIVE',
      };

      dispatch(addTheater(newTheater));
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/manager/theaters');
      }, 2000);
    } catch (error) {
      console.error('Error adding theater:', error);
    }
  };

  return (
    <Container className="py-4">
      {showSuccess && (
        <Alert variant="success" className="mb-4">
          Theater added successfully! Redirecting...
        </Alert>
      )}

      <Card>
        <Card.Header as="h5">Add New Theater</Card.Header>
        <Card.Body>
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Theater Name</Form.Label>
                  <Form.Control
                    required
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter theater name"
                  />
                  <Form.Control.Feedback type="invalid">
                    Please enter theater name
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Location</Form.Label>
                  <Form.Control
                    required
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Enter location"
                  />
                  <Form.Control.Feedback type="invalid">
                    Please enter location
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Total Screens</Form.Label>
                  <Form.Control
                    required
                    type="number"
                    name="totalScreens"
                    value={formData.totalScreens}
                    onChange={handleChange}
                    placeholder="Enter number of screens"
                    min="1"
                  />
                  <Form.Control.Feedback type="invalid">
                    Please enter valid number of screens
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    required
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter street address"
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>City</Form.Label>
                      <Form.Control
                        required
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>State</Form.Label>
                      <Form.Control
                        required
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>ZIP</Form.Label>
                      <Form.Control
                        required
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter theater description"
              />
            </Form.Group>

            <div className="d-flex gap-2">
              <Button variant="primary" type="submit">
                Add Theater
              </Button>
              <Button variant="outline-secondary" onClick={() => navigate('/manager/theaters')}>
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AddTheater;