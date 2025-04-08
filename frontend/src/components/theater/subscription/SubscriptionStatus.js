import React, { useEffect, useState } from 'react';
import { Card, Button, Alert, Badge, Spinner, Modal, Table } from 'react-bootstrap';
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
import { Clock, AlertTriangle, CheckCircle, Calendar, IndianRupee } from 'lucide-react';

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

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </div>
        );
    }

    // Check if subscription is expiring within 7 days
    const isExpiringSoon = currentSubscription && 
        currentSubscription.status === 'ACTIVE' &&
        differenceInDays(new Date(currentSubscription.endDate), new Date()) <= 7;

    return (
        <>
            <Card className="m-4 shadow-sm">
                <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Subscription Status</h5>
                    {currentSubscription && currentSubscription.status && (
                        <Badge bg={getStatusBadgeVariant(currentSubscription.status)}>
                            {currentSubscription.status}
                        </Badge>
                    )}
                </Card.Header>
                <Card.Body>
                    {error && error.includes("No active subscription found") ? (
                        // Handle specific error for no active subscription
                        <div className="text-center py-4">
                            <AlertTriangle size={48} className="text-warning mb-3" />
                            <h5>No Active Subscription</h5>
                            <p className="text-muted">Subscribe to a plan to access all features.</p>
                            <Button variant="primary" onClick={handleRenewal}>
                                View Subscription Plans
                            </Button>
                        </div>
                    ) : error ? (
                        // Handle other errors
                        <Alert variant="danger" dismissible onClose={() => dispatch(clearError())}>
                            {typeof error === 'object' ? 'An error occurred. Please try again.' : error}
                        </Alert>
                    ) : !isActive || !currentSubscription ? (
                        // No active subscription status
                        <div className="text-center py-4">
                            <AlertTriangle size={48} className="text-warning mb-3" />
                            <h5>No Active Subscription</h5>
                            <p className="text-muted">Subscribe to a plan to access all features.</p>
                            <Button variant="primary" onClick={handleRenewal}>
                                View Subscription Plans
                            </Button>
                        </div>
                    ) : (
                        // Active subscription details
                        <>
                            <div className="row mb-4">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <div className="d-flex align-items-center mb-2">
                                            <CheckCircle size={20} className="text-success me-2" />
                                            <strong>Current Plan:</strong>
                                        </div>
                                        <p className="ms-4 mb-0">
                                            {currentSubscription.plan && typeof currentSubscription.plan === 'object' 
                                                ? currentSubscription.plan.name 
                                                : 'Standard Plan'}
                                        </p>
                                    </div>
                                    <div className="mb-3">
                                        <div className="d-flex align-items-center mb-2">
                                            <Calendar size={20} className="text-primary me-2" />
                                            <strong>Start Date:</strong>
                                        </div>
                                        <p className="ms-4 mb-0">
                                            {currentSubscription.startDate ? 
                                                format(new Date(currentSubscription.startDate), 'PPP') : 
                                                'Not available'}
                                        </p>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <div className="d-flex align-items-center mb-2">
                                            <Clock size={20} className="text-warning me-2" />
                                            <strong>End Date:</strong>
                                        </div>
                                        <p className="ms-4 mb-0">
                                            {currentSubscription.endDate ? 
                                                format(new Date(currentSubscription.endDate), 'PPP') : 
                                                'Not available'}
                                        </p>
                                    </div>
                                    <div className="mb-3">
                                        <div className="d-flex align-items-center mb-2">
                                            <IndianRupee size={20} className="text-success me-2" />
                                            <strong>Amount Paid:</strong>
                                        </div>
                                        <p className="ms-4 mb-0">
                                            ₹{typeof currentSubscription.amount === 'number' 
                                                ? currentSubscription.amount.toFixed(2)
                                                : '0.00'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {isExpiringSoon && (
                                <Alert variant="warning" className="d-flex align-items-center">
                                    <AlertTriangle size={20} className="me-2" />
                                    Your subscription will expire in {differenceInDays(new Date(currentSubscription.endDate), new Date())} days.
                                    Please renew to continue accessing all features.
                                </Alert>
                            )}

                            <div className="d-flex justify-content-between align-items-center">
                                {subscriptionHistory && subscriptionHistory.length > 1 && (
                                    <Button 
                                        variant="outline-primary"
                                        onClick={() => setShowHistory(true)}
                                    >
                                        View History
                                    </Button>
                                )}
                                <Button 
                                    variant={isExpiringSoon ? "primary" : "outline-secondary"}
                                    onClick={handleRenewal}
                                    className={subscriptionHistory && subscriptionHistory.length <= 1 ? "ms-auto" : ""}
                                >
                                    {isExpiringSoon ? "Renew Subscription" : "Change Plan"}
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
            >
                <Modal.Header closeButton>
                    <Modal.Title>Subscription History</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {!subscriptionHistory || subscriptionHistory.length === 0 ? (
                        <Alert variant="info">No subscription history found.</Alert>
                    ) : (
                        <Table responsive hover>
                            <thead className="table-light">
                                <tr>
                                    <th>Plan</th>
                                    <th>Amount</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subscriptionHistory.map((subscription, index) => (
                                    <tr key={index}>
                                        <td>
                                            {subscription.plan && typeof subscription.plan === 'object'
                                                ? subscription.plan.name
                                                : 'Standard Plan'}
                                        </td>
                                        <td>
                                            ₹{typeof subscription.amount === 'number'
                                                ? subscription.amount.toFixed(2)
                                                : '0.00'}
                                        </td>
                                        <td>
                                            {subscription.startDate 
                                                ? format(new Date(subscription.startDate), 'PP')
                                                : 'N/A'}
                                        </td>
                                        <td>
                                            {subscription.endDate
                                                ? format(new Date(subscription.endDate), 'PP')
                                                : 'N/A'}
                                        </td>
                                        <td>
                                            <Badge bg={getStatusBadgeVariant(subscription.status)}>
                                                {subscription.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowHistory(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default SubscriptionStatus;