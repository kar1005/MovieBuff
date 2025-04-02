// src/components/subscription/SubscriptionStatus.js
import React, { useEffect, useState } from 'react';
import { Card, Button, Alert, Badge, Spinner, Modal, Table } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { 
    fetchManagerSubscription,
    fetchSubscriptionHistory,
    selectCurrentSubscription,
    selectSubscriptionHistory,
    selectSubscriptionLoading,
    selectSubscriptionError
} from '../../../redux/slices/subscriptionSlice';
import { format } from 'date-fns';
import { Clock, AlertTriangle, CheckCircle, Calendar, DollarSign, IndianRupee } from 'lucide-react';

const SubscriptionStatus = () => {
    const dispatch = useDispatch();
    const currentSubscription = useSelector(selectCurrentSubscription);
    const subscriptionHistory = useSelector(selectSubscriptionHistory);
    const loading = useSelector(selectSubscriptionLoading);
    const error = useSelector(selectSubscriptionError);
    const managerId = localStorage.getItem('userId');
    
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        if (managerId) {
            dispatch(fetchManagerSubscription(managerId));
            dispatch(fetchSubscriptionHistory(managerId));
        }
    }, [dispatch, managerId]);

    const handleRenewal = () => {
        // Navigate to subscription plans page
        window.location.href = '/manager/subscription/plans';
    };

    const getStatusBadgeVariant = (status) => {
        switch (status) {
            case 'ACTIVE':
                return 'success';
            case 'EXPIRED':
                return 'danger';
            case 'PENDING':
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

    if (error) {
        return (
            <Alert variant="danger" className="m-4">
                <AlertTriangle className="me-2" size={20} />
                {error}
            </Alert>
        );
    }

    const isExpiringSoon = currentSubscription && 
        new Date(currentSubscription.endDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return (
        <>
            <Card className="m-4 shadow-sm">
                <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Subscription Status</h5>
                    {currentSubscription && (
                        <Badge bg={getStatusBadgeVariant(currentSubscription.status)}>
                            {currentSubscription.status}
                        </Badge>
                    )}
                </Card.Header>
                <Card.Body>
                    {!currentSubscription ? (
                        <div className="text-center py-4">
                            <AlertTriangle size={48} className="text-warning mb-3" />
                            <h5>No Active Subscription</h5>
                            <p className="text-muted">Subscribe to a plan to access all features.</p>
                            <Button variant="primary" onClick={handleRenewal}>
                                View Subscription Plans
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="row mb-4">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <div className="d-flex align-items-center mb-2">
                                            <CheckCircle size={20} className="text-success me-2" />
                                            <strong>Current Plan:</strong>
                                        </div>
                                        <p className="ms-4 mb-0">{currentSubscription.plan.name}</p>
                                    </div>
                                    <div className="mb-3">
                                        <div className="d-flex align-items-center mb-2">
                                            <Calendar size={20} className="text-primary me-2" />
                                            <strong>Start Date:</strong>
                                        </div>
                                        <p className="ms-4 mb-0">
                                            {format(new Date(currentSubscription.startDate), 'PPP')}
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
                                            {format(new Date(currentSubscription.endDate), 'PPP')}
                                        </p>
                                    </div>
                                    <div className="mb-3">
                                        <div className="d-flex align-items-center mb-2">
                                            <IndianRupee size={20} className="text-success me-2" />
                                            <strong>Amount Paid:</strong>
                                        </div>
                                        <p className="ms-4 mb-0">₹{currentSubscription.amount}</p>
                                    </div>
                                </div>
                            </div>

                            {isExpiringSoon && (
                                <Alert variant="warning" className="d-flex align-items-center">
                                    <AlertTriangle size={20} className="me-2" />
                                    Your subscription will expire soon. Please renew to continue accessing all features.
                                </Alert>
                            )}

                            <div className="d-flex justify-content-between align-items-center">
                                <Button 
                                    variant="outline-primary"
                                    onClick={() => setShowHistory(true)}
                                >
                                    View History
                                </Button>
                                <Button 
                                    variant="primary"
                                    onClick={handleRenewal}
                                    disabled={!isExpiringSoon}
                                >
                                    Renew Subscription
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
                    {subscriptionHistory.length === 0 ? (
                        <Alert variant="info">No subscription history found.</Alert>
                    ) : (
                        <Table responsive>
                            <thead>
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
                                        <td>{subscription.plan.name}</td>
                                        <td>₹{subscription.amount}</td>
                                        <td>{format(new Date(subscription.startDate), 'PP')}</td>
                                        <td>{format(new Date(subscription.endDate), 'PP')}</td>
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