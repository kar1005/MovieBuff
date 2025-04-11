import React, { useEffect, useState } from 'react';
import { Card, Button, Alert, Badge, Spinner, Modal, Table, Container, Row, Col } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
    fetchManagerSubscription,
    fetchSubscriptionHistory,
    checkSubscriptionStatus,
    selectCurrentSubscription,
    selectSubscriptionHistory,
    selectSubscriptionLoading,
    selectSubscriptionError,
    selectIsSubscriptionActive,
    clearError
} from '../../../redux/slices/subscriptionSlice';
import { format, differenceInDays } from 'date-fns';
import { Clock, AlertTriangle, CheckCircle, Calendar, IndianRupee, X, CreditCard, FileText, ArrowUpRight } from 'lucide-react';

const SubscriptionStatus = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    const currentSubscription = useSelector(selectCurrentSubscription);
    const subscriptionHistory = useSelector(selectSubscriptionHistory);
    const loading = useSelector(selectSubscriptionLoading);
    const error = useSelector(selectSubscriptionError);
    const isActive = useSelector(selectIsSubscriptionActive);
    
    const [showHistory, setShowHistory] = useState(false);
    const managerId = localStorage.getItem('userId');

    useEffect(() => {
        if (managerId) {
            dispatch(checkSubscriptionStatus(managerId));
            
            // Fetch subscription history regardless of active status
            dispatch(fetchSubscriptionHistory(managerId));
            
            // Try to fetch current subscription if active
            if (isActive) {
                dispatch(fetchManagerSubscription(managerId));
            }
        }
        
        // Clear any existing errors when component unmounts
        return () => {
            dispatch(clearError());
        };
    }, [dispatch, managerId, isActive]);

    const handleRenewal = () => {
        navigate('/manager/subscription');
    };

    const getStatusBadgeVariant = (status) => {
        switch (status) {
            case 'ACTIVE':
                return 'success';
            case 'EXPIRED':
                return 'danger';
            case 'CANCELLED':
                return 'danger';
            case 'PENDING':
                return 'warning';
            case 'PAYMENT_FAILED':
                return 'warning';
            default:
                return 'secondary';
        }
    };

    // Check if subscription is expiring within 7 days
    const isExpiringSoon = currentSubscription && 
        currentSubscription.status === 'ACTIVE' &&
        differenceInDays(new Date(currentSubscription.endDate), new Date()) <= 7;

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="text-center">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3 text-muted">Loading subscription details...</p>
                </div>
            </Container>
        );
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'PPP');
        } catch (e) {
            return 'Invalid date';
        }
    };

    return (
        <Container fluid className="py-4">
            <Card className="shadow-sm border-0 rounded-3">
                <Card.Header 
                    className="bg-white border-0 py-3"
                    style={{ borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem' }}
                >
                    <div className="d-flex justify-content-between align-items-center">
                        <h4 className="fw-bold mb-0 text-primary">Subscription Status</h4>
                        {currentSubscription && currentSubscription.status && (
                            <Badge 
                                bg={getStatusBadgeVariant(currentSubscription.status)}
                                className="px-3 py-2 rounded-pill"
                            >
                                {currentSubscription.status}
                            </Badge>
                        )}
                    </div>
                </Card.Header>
                <Card.Body className="px-4 py-4">
                    {error && (typeof error === 'string' && error.includes("No active subscription found")) ? (
                        // Handle specific error for no active subscription
                        <div className="text-center py-5">
                            <div 
                                className="mb-4 d-flex justify-content-center align-items-center mx-auto"
                                style={{ 
                                    width: '80px', 
                                    height: '80px', 
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(255, 193, 7, 0.1)'
                                }}
                            >
                                <AlertTriangle size={40} className="text-warning" />
                            </div>
                            <h4 className="mb-3">No Active Subscription</h4>
                            <p className="text-muted mb-4">
                                You currently don't have an active subscription plan.<br />
                                Subscribe to unlock all theater management features.
                            </p>
                            <Button 
                                variant="primary" 
                                size="lg" 
                                className="rounded-pill px-4 py-2" 
                                onClick={handleRenewal}
                            >
                                <CreditCard size={18} className="me-2" />
                                View Subscription Plans
                            </Button>
                        </div>
                    ) : error ? (
                        // Handle other errors
                        <Alert variant="danger" dismissible onClose={() => dispatch(clearError())}>
                            <div className="d-flex align-items-center">
                                <AlertTriangle size={20} className="me-2" />
                                <div>{typeof error === 'object' ? 'An error occurred. Please try again.' : error}</div>
                            </div>
                        </Alert>
                    ) : !isActive || !currentSubscription ? (
                        // No active subscription status
                        <div className="text-center py-5">
                            <div 
                                className="mb-4 d-flex justify-content-center align-items-center mx-auto"
                                style={{ 
                                    width: '80px', 
                                    height: '80px', 
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(255, 193, 7, 0.1)'
                                }}
                            >
                                <AlertTriangle size={40} className="text-warning" />
                            </div>
                            <h4 className="mb-3">No Active Subscription</h4>
                            <p className="text-muted mb-4">
                                You currently don't have an active subscription plan.<br />
                                Subscribe to unlock all theater management features.
                            </p>
                            <Button 
                                variant="primary" 
                                size="lg" 
                                className="rounded-pill px-4 py-2" 
                                onClick={handleRenewal}
                            >
                                <CreditCard size={18} className="me-2" />
                                View Subscription Plans
                            </Button>
                        </div>
                    ) : (
                        // Active subscription details
                        <>
                            <Row className="mb-4 g-4">
                                <Col md={12} lg={6}>
                                    <Card className="h-100 border-0 bg-light">
                                        <Card.Body className="p-4">
                                            <h5 className="mb-3 d-flex align-items-center">
                                                <CheckCircle size={20} className="text-success me-2" />
                                                Plan Details
                                            </h5>
                                            <div className="mb-3 ps-2">
                                                <div className="d-flex align-items-center mb-2">
                                                    <div className="text-muted" style={{ width: '120px' }}>Current Plan:</div>
                                                    <div className="fw-bold">
                                                        {currentSubscription.plan && typeof currentSubscription.plan === 'object' 
                                                            ? currentSubscription.plan.name 
                                                            : 'Standard Plan'}
                                                    </div>
                                                </div>
                                                <div className="d-flex align-items-center">
                                                    <div className="text-muted" style={{ width: '120px' }}>Amount Paid:</div>
                                                    <div className="fw-bold">
                                                        ₹{typeof currentSubscription.amount === 'number' 
                                                            ? currentSubscription.amount.toFixed(2)
                                                            : '0.00'}
                                                    </div>
                                                </div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={12} lg={6}>
                                    <Card className="h-100 border-0 bg-light">
                                        <Card.Body className="p-4">
                                            <h5 className="mb-3 d-flex align-items-center">
                                                <Calendar size={20} className="text-primary me-2" />
                                                Subscription Period
                                            </h5>
                                            <div className="mb-3 ps-2">
                                                <div className="d-flex align-items-center mb-2">
                                                    <div className="text-muted" style={{ width: '120px' }}>Start Date:</div>
                                                    <div className="fw-bold">
                                                        {formatDate(currentSubscription.startDate)}
                                                    </div>
                                                </div>
                                                <div className="d-flex align-items-center">
                                                    <div className="text-muted" style={{ width: '120px' }}>End Date:</div>
                                                    <div className="fw-bold">
                                                        {formatDate(currentSubscription.endDate)}
                                                    </div>
                                                </div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            {isExpiringSoon && (
                                <Alert variant="warning" className="d-flex align-items-center p-3 mb-4">
                                    <div
                                        className="d-flex justify-content-center align-items-center me-3"
                                        style={{
                                            minWidth: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            backgroundColor: 'rgba(255, 193, 7, 0.1)'
                                        }}
                                    >
                                        <AlertTriangle size={20} className="text-warning" />
                                    </div>
                                    <div>
                                        <p className="mb-0 fw-medium">
                                            Your subscription will expire in <strong>{differenceInDays(new Date(currentSubscription.endDate), new Date())} days</strong>.
                                            {' '}Please renew to continue accessing all features.
                                        </p>
                                    </div>
                                </Alert>
                            )}

                            <div className="d-flex justify-content-between align-items-center mt-4">
                                {subscriptionHistory && subscriptionHistory.length > 1 && (
                                    <Button 
                                        variant="outline-secondary"
                                        className="rounded-pill px-4 d-flex align-items-center"
                                        onClick={() => setShowHistory(true)}
                                    >
                                        <FileText size={16} className="me-2" />
                                        View History
                                    </Button>
                                )}
                                <Button 
                                    variant={isExpiringSoon ? "primary" : "outline-primary"}
                                    className={`rounded-pill px-4 d-flex align-items-center ${subscriptionHistory && subscriptionHistory.length <= 1 ? "ms-auto" : ""}`}
                                    onClick={handleRenewal}
                                >
                                    {isExpiringSoon ? (
                                        <>
                                            <CreditCard size={16} className="me-2" />
                                            Renew Subscription
                                        </>
                                    ) : (
                                        <>
                                            <ArrowUpRight size={16} className="me-2" />
                                            Change Plan
                                        </>
                                    )}
                                </Button>
                            </div>
                        </>
                    )}
                </Card.Body>
            </Card>

            {/* Subscription History Modal */}
            <Modal
                show={showHistory}
                onHide={() => setShowHistory(false)}
                size="lg"
                centered
            >
                <Modal.Header className="border-0 pb-0">
                    <Modal.Title className="fw-bold">Subscription History</Modal.Title>
                    <Button 
                        variant="link" 
                        className="p-0 border-0 text-muted" 
                        style={{ fontSize: '1.5rem' }}
                        onClick={() => setShowHistory(false)}
                    >
                        <X size={24} />
                    </Button>
                </Modal.Header>
                <Modal.Body className="pt-2 px-4">
                    {!subscriptionHistory || subscriptionHistory.length === 0 ? (
                        <Alert variant="info" className="d-flex align-items-center">
                            <AlertTriangle size={18} className="me-2" />
                            <div>No subscription history found.</div>
                        </Alert>
                    ) : (
                        <div className="table-responsive">
                            <Table hover className="align-middle">
                                <thead>
                                    <tr>
                                        <th className="border-0 text-muted">Plan</th>
                                        <th className="border-0 text-muted">Amount</th>
                                        <th className="border-0 text-muted">Start Date</th>
                                        <th className="border-0 text-muted">End Date</th>
                                        <th className="border-0 text-muted">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subscriptionHistory.map((subscription, index) => (
                                        <tr key={index}>
                                            <td className="py-3">
                                                <span className="fw-medium">
                                                    {subscription.plan && typeof subscription.plan === 'object'
                                                        ? subscription.plan.name
                                                        : 'Standard Plan'}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                ₹{typeof subscription.amount === 'number'
                                                    ? subscription.amount.toFixed(2)
                                                    : '0.00'}
                                            </td>
                                            <td className="py-3">
                                                {formatDate(subscription.startDate)}
                                            </td>
                                            <td className="py-3">
                                                {formatDate(subscription.endDate)}
                                            </td>
                                            <td className="py-3">
                                                <Badge 
                                                    bg={getStatusBadgeVariant(subscription.status)}
                                                    className="rounded-pill px-3 py-2"
                                                >
                                                    {subscription.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button 
                        variant="primary" 
                        className="rounded-pill px-4"
                        onClick={() => setShowHistory(false)}
                    >
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default SubscriptionStatus;