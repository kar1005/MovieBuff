// src/components/customer/Layout/Footer.js
import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
    Film, 
    Instagram, 
    Twitter, 
    Facebook,
    Youtube,
    Mail,
    Phone,
    MapPin
} from 'lucide-react';
import './Footer.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="customer-footer">
            <Container fluid className="footer-top py-5">
                <Container>
                    <Row>
                        <Col lg={4} md={6} className="mb-4 mb-md-0">
                            <div className="footer-brand">
                                <Film size={32} className="mb-3" />
                                <h2 className="h4 mb-3">MovieBuff</h2>
                                <p className="mb-3">
                                    Your one-stop destination for booking movie tickets online. 
                                    Enjoy the latest blockbusters with premium comfort.
                                </p>
                                    {/* <div className="social-links">
                                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                            <Instagram size={20} />
                                        </a>
                                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                                            <Twitter size={20} />
                                        </a>
                                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                                            <Facebook size={20} />
                                        </a>
                                        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                                            <Youtube size={20} />
                                        </a>
                                    </div> */}
                            </div>
                        </Col>
                        
                        <Col lg={2} md={6} className="mb-4 mb-md-0">
                            <h5 className="footer-heading">Quick Links</h5>
                            <ul className="footer-links">
                                <li><Link to="/customer/movies">Movies</Link></li>
                                <li><Link to="/customer/theaters">Theaters</Link></li>
                                <li><Link to="/customer/upcoming">Upcoming</Link></li>
                                {/* <li><Link to="/customer/offers">Offers</Link></li>
                                <li><Link to="/customer/gift-cards">Gift Cards</Link></li> */}
                            </ul>
                        </Col>
                        
                        <Col lg={2} md={6} className="mb-4 mb-md-0">
                            <h5 className="footer-heading">Information</h5>
                            <ul className="footer-links">
                                {/* <li><Link to="/customer/about">About Us</Link></li> */}
                                <li><Link to="/customer/faq">FAQs</Link></li>
                                {/* <li><Link to="/customer/terms">Terms of Use</Link></li>
                                <li><Link to="/customer/privacy">Privacy Policy</Link></li>
                                <li><Link to="/customer/careers">Careers</Link></li> */}
                            </ul>
                        </Col>
                        
                        <Col lg={4} md={6}>
                            <h5 className="footer-heading">Contact Us</h5>
                            <ul className="footer-contact">
                                <li>
                                    <MapPin size={18} />
                                    <span>DDU college Road, Nadiad, 387001</span>
                                </li>
                                <li>
                                    <Phone size={18} />
                                    <span>+91 9898985452</span>
                                </li>
                                <li>
                                    <Mail size={18} />
                                    <span>bookwithmoviebuff@gmail.com</span>
                                </li>
                            </ul>
                            
                            {/* <div className="newsletter mt-4">
                                <h6>Subscribe to Our Newsletter</h6>
                                <form className="newsletter-form">
                                    <input 
                                        type="email" 
                                        placeholder="Your email address" 
                                        required 
                                    />
                                    <button type="submit">Subscribe</button>
                                </form>
                            </div> */}
                        </Col>
                    </Row>
                </Container>
            </Container>
            
            <div className="footer-bottom py-3">
                <Container className="text-center">
                    <p className="mb-0">
                        &copy; {currentYear} MovieBuff. All rights reserved.
                    </p>
                </Container>
            </div>
        </footer>
    );
};

export default Footer;