import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Form, 
  Button, 
  Table, 
  Modal, 
  Badge, 
  Spinner,
  Alert,
  InputGroup
} from 'react-bootstrap';
import { Plus, Pencil, ToggleRight, ToggleLeft } from 'lucide-react';

const ManageSubscriptionPlans = () => {
    const [plans, setPlans] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [error, setError] = useState(null);
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
        setFetchLoading(true);
        setError(null);
        try {
            const response = await axios.get('http://localhost:8080/api/subscription-plans');
            setPlans(response.data);
        } catch (error) {
            console.error('Error fetching plans:', error);
            setError('Failed to load subscription plans. Please try again later.');
        } finally {
            setFetchLoading(false);
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
        setError(null);
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
            setError('Failed to save plan. Please check your input and try again.');
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
            setError('Failed to update plan status. Please try again.');
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
        setError(null);
    };

    // Close modal and reset form
    const handleCloseModal = () => {
        setShowModal(false);
        resetForm();
    };

    return (
        <Container className="py-5">
            {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-4">
                    {error}
                </Alert>
            )}
            
            <Card className="border-0 shadow-sm mb-4">
                <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
                    <h4 className="mb-0 text-primary">Subscription Plans</h4>
                    <Button 
                        variant="primary" 
                        className="d-flex align-items-center" 
                        onClick={() => setShowModal(true)}
                    >
                        <Plus className="me-2" size={18} />
                        Add New Plan
                    </Button>
                </Card.Header>
                <Card.Body className="p-0">
                    {fetchLoading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-2 text-muted">Loading subscription plans...</p>
                        </div>
                    ) : plans.length === 0 ? (
                        <div className="text-center py-5">
                            <p className="text-muted">No subscription plans found. Add your first plan to get started.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table hover className="mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="py-3">Name</th>
                                        <th className="py-3">Duration</th>
                                        <th className="py-3">Price</th>
                                        <th className="py-3">Status</th>
                                        <th className="py-3">Features</th>
                                        <th className="py-3 text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {plans.map((plan) => (
                                        <tr key={plan.id}>
                                            <td className="py-3 align-middle">
                                                <span className="fw-medium">{plan.name}</span>
                                            </td>
                                            <td className="py-3 align-middle text-capitalize">
                                                {plan.duration.toLowerCase()}
                                            </td>
                                            <td className="py-3 align-middle">
                                                <span className="fw-medium">₹{plan.price.toFixed(2)}</span>
                                            </td>
                                            <td className="py-3 align-middle">
                                                <Badge bg={plan.isActive ? 'success' : 'secondary'} pill>
                                                    {plan.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td className="py-3 align-middle">
                                                <ul className="mb-0 ps-3 small text-secondary">
                                                    {plan.features.slice(0, 2).map((feature, index) => (
                                                        <li key={index}>{feature}</li>
                                                    ))}
                                                    {plan.features.length > 2 && (
                                                        <li className="text-primary">+{plan.features.length - 2} more</li>
                                                    )}
                                                </ul>
                                            </td>
                                            <td className="py-3 align-middle text-end">
                                                <Button 
                                                    variant="link" 
                                                    className="me-2 p-0 text-decoration-none"
                                                    onClick={() => handleEdit(plan)}
                                                >
                                                    <Pencil className="text-primary" size={18} />
                                                </Button>
                                                <Button 
                                                    variant="link"
                                                    className="p-0 text-decoration-none"
                                                    onClick={() => handleToggleStatus(plan.id)}
                                                >
                                                    {plan.isActive 
                                                        ? <ToggleRight className="text-success" size={20} /> 
                                                        : <ToggleLeft className="text-secondary" size={20} />
                                                    }
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Add/Edit Plan Modal */}
            <Modal 
                show={showModal} 
                onHide={handleCloseModal}
                centered
                backdrop="static"
                size="lg"
            >
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="text-primary">
                        {selectedPlan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body className="pt-2">
                        <Row>
                            <Col md={8}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Plan Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Basic, Premium, Enterprise"
                                        required
                                        className="shadow-none"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Duration</Form.Label>
                                    <Form.Select
                                        name="duration"
                                        value={formData.duration}
                                        onChange={handleInputChange}
                                        className="shadow-none"
                                    >
                                        <option value="MONTHLY">Monthly</option>
                                        <option value="YEARLY">Yearly</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Describe what this subscription plan offers..."
                                rows={2}
                                required
                                className="shadow-none"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Price (₹)</Form.Label>
                            <InputGroup>
                                <InputGroup.Text>₹</InputGroup.Text>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    placeholder="0.00"
                                    required
                                    className="shadow-none"
                                />
                            </InputGroup>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Features (one per line)</Form.Label>
                            <Form.Control
                                as="textarea"
                                name="features"
                                value={formData.features.join('\n')}
                                onChange={handleInputChange}
                                placeholder="Enter each feature on a new line, e.g.:\nUnlimited screens\nPriority support\nAdvanced analytics"
                                rows={5}
                                required
                                className="shadow-none"
                            />
                            <Form.Text className="text-muted">
                                List the benefits that come with this plan. Each line will be displayed as a separate feature.
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="d-flex align-items-center mb-2">
                            <Form.Check
                                type="switch"
                                id="plan-status"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                                label=""
                                className="me-2"
                            />
                            <Form.Label htmlFor="plan-status" className="mb-0">
                                {formData.isActive ? 'Active' : 'Inactive'}
                            </Form.Label>
                        </Form.Group>
                        <Form.Text className="text-muted">
                            {formData.isActive 
                                ? 'Plan will be visible and available for purchase.' 
                                : 'Plan will be hidden from customers.'}
                        </Form.Text>
                    </Modal.Body>
                    <Modal.Footer className="border-0 pt-0">
                        <Button 
                            variant="outline-secondary" 
                            onClick={handleCloseModal}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="primary" 
                            type="submit" 
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                                    Saving...
                                </>
                            ) : (
                                'Save Plan'
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default ManageSubscriptionPlans;