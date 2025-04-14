// src/components/customer/HelpSupport/HelpSupportPage.js
import React, { useState } from 'react';
import { Container, Row, Col, Card, Accordion, Form, Button, Alert } from 'react-bootstrap';
import { Mail, Phone, MessageSquare, Send, HelpCircle, Twitter, Facebook, Instagram } from 'lucide-react';
import CustomerLayout from '../Layout/CustomerLayout';
import './HelpSupportPage.css';

const HelpSupportPage = () => {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [validated, setValidated] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ show: false, type: '', message: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContactForm({
      ...contactForm,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    // Here you would typically dispatch an action to send the contact form
    // For now, we'll simulate a successful submission
    setSubmitMessage({
      show: true,
      type: 'success',
      message: 'Your message has been sent! Our team will get back to you shortly.'
    });
    
    // Reset the form
    setContactForm({
      name: '',
      email: '',
      subject: '',
      message: '',
    });
    setValidated(false);
    
    // Hide the success message after 5 seconds
    setTimeout(() => {
      setSubmitMessage({ show: false, type: '', message: '' });
    }, 5000);
  };

  return (
      <div className="help-support-page">
        <div className="help-support-header">
          <Container>
            <Row className="justify-content-center text-center">
              <Col md={8}>
                <h1>Help & Support</h1>
                <p className="lead">
                  We're here to help you with any questions or issues you might have.
                </p>
              </Col>
            </Row>
          </Container>
        </div>

        <Container className="mt-5">
          <Row>
            <Col lg={4} className="mb-4">
              <Card className="contact-card h-100">
                <Card.Body className="text-center">
                  <div className="contact-icon">
                    <Mail size={28} />
                  </div>
                  <Card.Title className="mt-3">Email Support</Card.Title>
                  <Card.Text>
                    Get in touch with our customer support team
                  </Card.Text>
                  <a href="mailto:support@moviebuff.com" className="contact-link">
                    support@moviebuff.com
                  </a>
                </Card.Body>
              </Card>
            </Col>
            
            <Col lg={4} className="mb-4">
              <Card className="contact-card h-100">
                <Card.Body className="text-center">
                  <div className="contact-icon">
                    <Phone size={28} />
                  </div>
                  <Card.Title className="mt-3">Phone Support</Card.Title>
                  <Card.Text>
                    Available Monday - Saturday, 9AM - 6PM
                  </Card.Text>
                  <a href="tel:+911234567890" className="contact-link">
                    +91 12345 67890
                  </a>
                </Card.Body>
              </Card>
            </Col>
            
            <Col lg={4} className="mb-4">
              <Card className="contact-card h-100">
                <Card.Body className="text-center">
                  <div className="contact-icon">
                    <MessageSquare size={28} />
                  </div>
                  <Card.Title className="mt-3">Live Chat</Card.Title>
                  <Card.Text>
                    Chat with our representatives in real-time
                  </Card.Text>
                  <Button variant="outline-primary" className="mt-2">
                    Start Chat
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Row className="mt-5">
            <Col md={12}>
              <h2 className="text-center mb-4">Frequently Asked Questions</h2>
            </Col>
            
            <Col md={12}>
              <Accordion className="faq-accordion">
                <Accordion.Item eventKey="0">
                  <Accordion.Header>How do I book movie tickets?</Accordion.Header>
                  <Accordion.Body>
                    <p>Booking movie tickets on MovieBuff is quick and simple:</p>
                    <ol>
                      <li>Search for a movie or browse through currently playing movies on the homepage</li>
                      <li>Select the movie you want to watch</li>
                      <li>Choose your preferred theater, date, and show time</li>
                      <li>Select your seats from the available options</li>
                      <li>Choose any add-ons or apply discount coupons</li>
                      <li>Complete the payment process</li>
                      <li>Your tickets will be emailed to you and will also be available in the "My Bookings" section of your profile</li>
                    </ol>
                  </Accordion.Body>
                </Accordion.Item>
                
                <Accordion.Item eventKey="1">
                  <Accordion.Header>How can I cancel my booking?</Accordion.Header>
                  <Accordion.Body>
                    <p>To cancel your booking:</p>
                    <ol>
                      <li>Go to "My Profile" and select "Booking History"</li>
                      <li>Find the booking you wish to cancel</li>
                      <li>Click on "View Details" and then the "Cancel Booking" button</li>
                      <li>Select a reason for cancellation and confirm</li>
                    </ol>
                    <p className="mt-3"><strong>Cancellation Policy:</strong></p>
                    <ul>
                      <li>Full refund if cancelled more than 24 hours before show time</li>
                      <li>75% refund if cancelled between 12-24 hours before show time</li>
                      <li>50% refund if cancelled between 4-12 hours before show time</li>
                      <li>No refund for cancellations less than 4 hours before show time</li>
                    </ul>
                    <p className="mt-2"><em>Note: Some special screenings or events may have different cancellation policies.</em></p>
                  </Accordion.Body>
                </Accordion.Item>
                
                <Accordion.Item eventKey="2">
                  <Accordion.Header>What payment methods do you accept?</Accordion.Header>
                  <Accordion.Body>
                    <p>We accept a variety of payment methods for your convenience:</p>
                    <ul>
                      <li>Credit Cards (Visa, MasterCard, American Express)</li>
                      <li>Debit Cards</li>
                      <li>Net Banking</li>
                      <li>UPI (Google Pay, PhonePe, Paytm, etc.)</li>
                      <li>Mobile Wallets (Paytm, Amazon Pay, etc.)</li>
                      <li>Gift Cards and Vouchers</li>
                    </ul>
                    <p>All payments are secure and processed through our trusted payment gateways.</p>
                  </Accordion.Body>
                </Accordion.Item>
                
                <Accordion.Item eventKey="3">
                  <Accordion.Header>How do I use a promo code?</Accordion.Header>
                  <Accordion.Body>
                    <p>To apply a promotional code or coupon:</p>
                    <ol>
                      <li>Proceed with your booking until you reach the payment page</li>
                      <li>Look for the "Have a coupon?" or "Apply Promo Code" section</li>
                      <li>Enter your coupon code in the designated field</li>
                      <li>Click "Apply" to see the discount reflected in your total amount</li>
                    </ol>
                    <p>If your code is valid, the discount will be automatically applied to your booking. If you encounter any issues with your code, please contact our customer support team.</p>
                  </Accordion.Body>
                </Accordion.Item>
                
                <Accordion.Item eventKey="4">
                  <Accordion.Header>Can I choose my seats?</Accordion.Header>
                  <Accordion.Body>
                    <p>Yes! We offer interactive seat selection for all our theaters. When booking, you'll be shown a seat layout of the theater with:</p>
                    <ul>
                      <li>Available seats</li>
                      <li>Already booked seats</li>
                      <li>Different price categories (Premium, Standard, etc.)</li>
                    </ul>
                    <p>You can select your preferred seats from the available options. Some theaters also offer special seating options like recliners or couple seats which will be marked accordingly in the seating chart.</p>
                  </Accordion.Body>
                </Accordion.Item>
                
                <Accordion.Item eventKey="5">
                  <Accordion.Header>How can I get my tickets?</Accordion.Header>
                  <Accordion.Body>
                    <p>After successfully booking and payment, you can access your tickets in multiple ways:</p>
                    <ul>
                      <li><strong>Email:</strong> Tickets are sent to your registered email address</li>
                      <li><strong>SMS:</strong> A confirmation with a booking ID is sent to your registered mobile number</li>
                      <li><strong>App/Website:</strong> Tickets are available in the "My Bookings" section of your profile</li>
                    </ul>
                    <p>At the theater, you can show either the e-ticket on your phone (with the QR code) or the booking ID along with a valid ID proof. Some theaters also have self-service kiosks where you can collect physical tickets by entering your booking details.</p>
                  </Accordion.Body>
                </Accordion.Item>
                
                <Accordion.Item eventKey="6">
                  <Accordion.Header>What if I don't receive my booking confirmation?</Accordion.Header>
                  <Accordion.Body>
                    <p>If you don't receive your booking confirmation within 15 minutes of completing your payment, please:</p>
                    <ol>
                      <li>Check your email spam/junk folder</li>
                      <li>Verify if the payment was deducted from your account</li>
                      <li>Login to your MovieBuff account and check the "My Bookings" section</li>
                    </ol>
                    <p>If your booking is not visible in your account but the payment was deducted, please contact our customer support immediately with your payment reference details. We'll assist you in resolving the issue promptly.</p>
                  </Accordion.Body>
                </Accordion.Item>
                
                <Accordion.Item eventKey="7">
                  <Accordion.Header>How can I update my profile information?</Accordion.Header>
                  <Accordion.Body>
                    <p>To update your profile information:</p>
                    <ol>
                      <li>Sign in to your MovieBuff account</li>
                      <li>Click on your profile icon in the top right corner</li>
                      <li>Select "Profile" from the dropdown menu</li>
                      <li>Click on the "Edit Profile" button or go to the "Profile Information" tab</li>
                      <li>Update your details as needed</li>
                      <li>Click "Save Changes" to confirm the updates</li>
                    </ol>
                    <p>You can update your name, email, phone number, address, and preferences. If you need to change your email address, you may be required to verify the new email address.</p>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </Col>
          </Row>
          
          <Row className="mt-5 mb-5">
            <Col md={6}>
              <div className="contact-form-container">
                <h3 className="mb-4">Get in Touch</h3>
                {submitMessage.show && (
                  <Alert variant={submitMessage.type} onClose={() => setSubmitMessage({...submitMessage, show: false})} dismissible>
                    {submitMessage.message}
                  </Alert>
                )}
                <Form noValidate validated={validated} onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Your Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={contactForm.name}
                      onChange={handleInputChange}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      Please provide your name.
                    </Form.Control.Feedback>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={contactForm.email}
                      onChange={handleInputChange}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      Please provide a valid email address.
                    </Form.Control.Feedback>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Subject</Form.Label>
                    <Form.Control
                      type="text"
                      name="subject"
                      value={contactForm.subject}
                      onChange={handleInputChange}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      Please provide a subject.
                    </Form.Control.Feedback>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Message</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      name="message"
                      value={contactForm.message}
                      onChange={handleInputChange}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      Please provide your message.
                    </Form.Control.Feedback>
                  </Form.Group>
                  
                  <Button variant="primary" type="submit" className="d-flex align-items-center">
                    <Send size={16} className="me-2" />
                    Send Message
                  </Button>
                </Form>
              </div>
            </Col>
            
            <Col md={6}>
              <div className="help-info-container">
                <h3 className="mb-4">Additional Resources</h3>
                
                <Card className="mb-4 additional-resource-card">
                  <Card.Body>
                    <div className="d-flex align-items-start">
                      <div className="resource-icon me-3">
                        <HelpCircle size={24} />
                      </div>
                      <div>
                        <Card.Title>Knowledge Base</Card.Title>
                        <Card.Text>
                          Browse our extensive collection of articles, guides, and tutorials to find answers to common questions and learn how to make the most of MovieBuff.
                        </Card.Text>
                        <Button variant="link" className="p-0">Visit Knowledge Base</Button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
                
                <h4 className="mb-3 mt-4">Reach Us</h4>
                <div className="reach-us-info mb-4">
                  <p>
                    <strong>Corporate Office:</strong><br />
                    MovieBuff Entertainment Pvt. Ltd.<br />
                    123 Cinema Street, Media Park<br />
                    Bangalore, Karnataka 560001<br />
                    India
                  </p>
                  <p>
                    <strong>Business Hours:</strong><br />
                    Monday - Friday: 9:00 AM - 6:00 PM<br />
                    Saturday: 10:00 AM - 4:00 PM<br />
                    Sunday: Closed
                  </p>
                </div>
                
                <h4 className="mb-3">Connect with Us</h4>
                <div className="social-links">
                  <a href="https://twitter.com/moviebuff" className="social-link" title="Twitter">
                    <Twitter size={20} />
                  </a>
                  <a href="https://facebook.com/moviebuff" className="social-link" title="Facebook">
                    <Facebook size={20} />
                  </a>
                  <a href="https://instagram.com/moviebuff" className="social-link" title="Instagram">
                    <Instagram size={20} />
                  </a>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
  );
};

export default HelpSupportPage;