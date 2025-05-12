import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import './UpdateCustomer.css';
import { updateUser } from '../../../services/userService'; // Adjust the import path as necessary

function UpdateCustomer({ customerId, handleClick }) {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
        address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
        },
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchCustomerData = async () => {
            try {
                setLoading(true);
                const data = await updateUser(customerId,formData); // Fetch customer data using the provided ID
                setFormData(data);
            } catch (error) {
                console.error('Error fetching customer data:', error);
                setError('Failed to load customer data. Please try again later.');
                toast.error('Failed to load customer data');
            } finally {
                setLoading(false);
            }
        };
        fetchCustomerData();
    }, [customerId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData((prevState) => ({
                ...prevState,
                [parent]: {
                    ...prevState[parent],
                    [child]: value,
                },
            }));
        } else {
            setFormData((prevState) => ({
                ...prevState,
                [name]: value,
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            toast.error('Passwords do not match');
            return;
        }

        try {
            setIsSubmitting(true);
            const updatedData = { ...formData };
            delete updatedData.confirmPassword;
            
            const response = await updateUser(customerId, updatedData); // Update customer data using the provided ID

            if (!response.ok) {
                throw new Error('Update failed');
            }

            toast.success('Customer updated successfully');
            handleClick('customers');
        } catch (error) {
            console.error('Error updating customer:', error);
            setError('Failed to update customer. Please try again.');
            toast.error('Update failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="update-customer-page">
                <Container>
                    <Row className="justify-content-center">
                        <Col xs={12} md={10} lg={8}>
                            <Card className="update-card">
                                <Card.Body className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <p className="mt-3">Loading customer data...</p>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        );
    }

    return (
        <div className="update-customer-page">
            <Container>
                <Row className="justify-content-center">
                    <Col xs={12} md={10} lg={8}>
                        <Card className="update-card">
                            <Card.Header className="text-center bg-transparent border-0 pt-4">
                                <h2 className="update-title">Update Customer</h2>
                                {error && (
                                    <Alert variant="danger" className="mt-3">
                                        {error}
                                    </Alert>
                                )}
                            </Card.Header>

                            <Card.Body className="px-4 py-4">
                                <Form onSubmit={handleSubmit}>
                                    {/* Personal Information Section */}
                                    <div className="section-container">
                                        <h3 className="section-title">Personal Information</h3>
                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Username</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="username"
                                                        required
                                                        value={formData.username}
                                                        onChange={handleChange}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Email</Form.Label>
                                                    <Form.Control
                                                        type="email"
                                                        name="email"
                                                        required
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>New Password</Form.Label>
                                                    <Form.Control
                                                        type="password"
                                                        name="password"
                                                        required
                                                        value={formData.password}
                                                        onChange={handleChange}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Confirm New Password</Form.Label>
                                                    <Form.Control
                                                        type="password"
                                                        name="confirmPassword"
                                                        required
                                                        value={formData.confirmPassword}
                                                        onChange={handleChange}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Phone Number</Form.Label>
                                                    <Form.Control
                                                        type="tel"
                                                        name="phoneNumber"
                                                        value={formData.phoneNumber}
                                                        onChange={handleChange}
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </div>

                                    {/* Address Section */}
                                    <div className="section-container">
                                        <h3 className="section-title">Address Details</h3>
                                        <Row>
                                            <Col md={12}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Street Address</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="address.street"
                                                        value={formData.address.street}
                                                        onChange={handleChange}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={4}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>City</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="address.city"
                                                        value={formData.address.city}
                                                        onChange={handleChange}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={4}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>State</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="address.state"
                                                        value={formData.address.state}
                                                        onChange={handleChange}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={4}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>ZIP Code</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="address.zipCode"
                                                        value={formData.address.zipCode}
                                                        onChange={handleChange}
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </div>

                                    <Button 
                                        variant="primary" 
                                        type="submit" 
                                        className="w-100 mt-4 update-button"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Updating...' : 'Update Customer'}
                                    </Button>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

export default UpdateCustomer;