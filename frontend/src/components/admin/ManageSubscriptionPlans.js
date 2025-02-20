import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Form, Button, Table, Modal, Badge } from 'react-bootstrap';

const ManageSubscriptionPlans = () => {
    const [plans, setPlans] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        duration: 'MONTHLY',
        features: [],
        isActive: true
    });

    // Fetch all plans
    const fetchPlans = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/subscription-plans');
            setPlans(response.data);
        } catch (error) {
            console.error('Error fetching plans:', error);
            alert('Error fetching plans');
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'features') {
            setFormData({
                ...formData,
                features: value.split('\n').filter(feature => feature.trim() !== '')
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = {
                ...formData,
                price: parseFloat(formData.price)
            };

            if (selectedPlan) {
                await axios.put(`http://localhost:8080/api/subscription-plans/${selectedPlan.id}`, data);
            } else {
                await axios.post('http://localhost:8080/api/subscription-plans', data);
            }
            
            setShowModal(false);
            fetchPlans();
            resetForm();
        } catch (error) {
            console.error('Error saving plan:', error);
            alert('Error saving subscription plan');
        } finally {
            setLoading(false);
        }
    };

    // Handle plan edit
    const handleEdit = (plan) => {
        setSelectedPlan(plan);
        setFormData({
            name: plan.name,
            description: plan.description,
            price: plan.price.toString(),
            duration: plan.duration,
            features: plan.features,
            isActive: plan.isActive
        });
        setShowModal(true);
    };

    // Handle plan toggle status
    const handleToggleStatus = async (id) => {
        try {
            await axios.patch(`http://localhost:8080/api/subscription-plans/${id}/toggle-status`);
            fetchPlans();
        } catch (error) {
            console.error('Error toggling plan status:', error);
            alert('Error toggling plan status');
        }
    };

    // Reset form
    const resetForm = () => {
        setSelectedPlan(null);
        setFormData({
            name: '',
            description: '',
            price: '',
            duration: 'MONTHLY',
            features: [],
            isActive: true
        });
    };

    return (
        <Container className="py-4">
            <Card className="mb-4">
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h2 className="mb-0">Subscription Plans</h2>
                        <Button variant="primary" onClick={() => setShowModal(true)}>
                            Add New Plan
                        </Button>
                    </div>

                    <Table responsive>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Duration</th>
                                <th>Price (₹)</th>
                                <th>Status</th>
                                <th>Features</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {plans.map((plan) => (
                                <tr key={plan.id}>
                                    <td>{plan.name}</td>
                                    <td>{plan.duration}</td>
                                    <td>₹{plan.price.toFixed(2)}</td>
                                    <td>
                                        <Badge bg={plan.isActive ? 'success' : 'danger'}>
                                            {plan.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </td>
                                    <td>
                                        <ul className="mb-0">
                                            {plan.features.map((feature, index) => (
                                                <li key={index}>{feature}</li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td>
                                        <Button 
                                            variant="outline-primary" 
                                            size="sm" 
                                            className="me-2"
                                            onClick={() => handleEdit(plan)}
                                        >
                                            Edit
                                        </Button>
                                        <Button 
                                            variant={plan.isActive ? "outline-danger" : "outline-success"} 
                                            size="sm"
                                            onClick={() => handleToggleStatus(plan.id)}
                                        >
                                            {plan.isActive ? 'Deactivate' : 'Activate'}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* Add/Edit Plan Modal */}
            <Modal show={showModal} onHide={() => { setShowModal(false); resetForm(); }}>
                <Modal.Header closeButton>
                    <Modal.Title>{selectedPlan ? 'Edit Plan' : 'Add New Plan'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Plan Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                required
                            />
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Price (₹)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Duration</Form.Label>
                                    <Form.Select
                                        name="duration"
                                        value={formData.duration}
                                        onChange={handleInputChange}
                                    >
                                        <option value="MONTHLY">Monthly</option>
                                        <option value="YEARLY">Yearly</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Features (one per line)</Form.Label>
                            <Form.Control
                                as="textarea"
                                name="features"
                                value={formData.features.join('\n')}
                                onChange={handleInputChange}
                                rows={4}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Check
                                type="switch"
                                name="isActive"
                                label="Active"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Plan'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default ManageSubscriptionPlans;