// src/components/admin/CustomerDetailsModal.js
import React from 'react';
import { Modal, Button, Row, Col, ListGroup, Badge } from 'react-bootstrap';
import { Calendar, MapPin, Ticket, Film, Star, Clock } from 'lucide-react';
import './CustomerDetailsModal.css';

const CustomerDetailsModal = ({ show, onHide, customer }) => {
  if (!customer) return null;

  // Format address if it exists
  const formatAddress = () => {
    if (!customer.address) return 'No address provided';
    
    const { street, city, state, zipCode } = customer.address;
    const addressParts = [street, city, state, zipCode].filter(Boolean);
    
    return addressParts.length > 0 
      ? addressParts.join(', ')
      : 'No address provided';
  };

  // Format preferences if they exist
  const formatPreferences = () => {
    if (!customer.preferences) return null;
    
    const { favoriteGenres, preferredLanguages } = customer.preferences;
    
    return (
      <>
        {favoriteGenres && favoriteGenres.length > 0 && (
          <ListGroup.Item>
            <div className="d-flex align-items-center mb-2">
              <Film size={16} className="text-primary me-2" />
              <strong>Favorite Genres:</strong>
            </div>
            <div className="ms-4">
              {favoriteGenres.map((genre, index) => (
                <Badge key={index} bg="info" className="me-1 mb-1">{genre}</Badge>
              ))}
            </div>
          </ListGroup.Item>
        )}
        
        {preferredLanguages && preferredLanguages.length > 0 && (
          <ListGroup.Item>
            <div className="d-flex align-items-center mb-2">
              <Star size={16} className="text-primary me-2" />
              <strong>Preferred Languages:</strong>
            </div>
            <div className="ms-4">
              {preferredLanguages.map((language, index) => (
                <Badge key={index} bg="secondary" className="me-1 mb-1">{language}</Badge>
              ))}
            </div>
          </ListGroup.Item>
        )}
      </>
    );
  };

  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return isNaN(date.getTime()) 
      ? 'Invalid Date' 
      : date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="lg"
      className="customer-details-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>Customer Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <Col md={6}>
            <div className="customer-profile mb-4">
              <div className="customer-avatar">
                {customer.username?.charAt(0) || '?'}
              </div>
              <h3 className="customer-name">{customer.username}</h3>
              <Badge bg={customer.role === 'CUSTOMER' ? 'success' : 'secondary'} pill>
                {customer.role || 'Customer'}
              </Badge>
            </div>
          </Col>
          <Col md={6}>
            <ListGroup variant="flush" className="customer-info">
              <ListGroup.Item>
                <div className="d-flex">
                  <div className="text-muted me-2">Email:</div>
                  <div>{customer.email || 'No email provided'}</div>
                </div>
              </ListGroup.Item>
              <ListGroup.Item>
                <div className="d-flex">
                  <div className="text-muted me-2">Phone:</div>
                  <div>{customer.phoneNumber || 'No phone provided'}</div>
                </div>
              </ListGroup.Item>
              <ListGroup.Item className="d-flex align-items-start">
                <div className="text-muted me-2">Address:</div>
                <div>{formatAddress()}</div>
              </ListGroup.Item>
            </ListGroup>
          </Col>
        </Row>

        <hr className="my-4" />

        <h5 className="mb-3">Account Information</h5>
        <ListGroup variant="flush" className="customer-info">
          <ListGroup.Item>
            <div className="d-flex align-items-center">
              <Calendar size={16} className="text-primary me-2" />
              <strong className="me-2">Created:</strong>
              <span>{formatDate(customer.createdAt)}</span>
            </div>
          </ListGroup.Item>
          <ListGroup.Item>
            <div className="d-flex align-items-center">
              <Clock size={16} className="text-primary me-2" />
              <strong className="me-2">Last Updated:</strong>
              <span>{formatDate(customer.updatedAt)}</span>
            </div>
          </ListGroup.Item>
          
          {customer.preferences?.preferredTheaters && customer.preferences.preferredTheaters.length > 0 && (
            <ListGroup.Item>
              <div className="d-flex align-items-center mb-2">
                <MapPin size={16} className="text-primary me-2" />
                <strong>Preferred Theaters:</strong>
              </div>
              <div className="ms-4">
                {customer.preferences.preferredTheaters.map((theaterId, index) => (
                  <Badge key={index} bg="dark" className="me-1 mb-1">Theater ID: {theaterId}</Badge>
                ))}
              </div>
            </ListGroup.Item>
          )}
          
          {formatPreferences()}
          
          <ListGroup.Item>
            <div className="d-flex align-items-center">
              <Ticket size={16} className="text-primary me-2" />
              <strong className="me-2">Booking History:</strong>
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={() => console.log('View booking history for ID:', customer.id)}
                className="ms-auto"
              >
                View Bookings
              </Button> 
              {/* //TODO : complete ViewBooking History for Admin  */}
            </div>
          </ListGroup.Item>
        </ListGroup>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CustomerDetailsModal;