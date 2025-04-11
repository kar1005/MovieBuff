import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { Check, AlertCircle, Award, Calendar, Tag, Clock } from 'lucide-react';
import {
    fetchActivePlans,
    fetchManagerSubscription,
    initiateSubscription,
    initiatePayment,
    verifyPayment,
    selectSubscriptionPlans,
    selectSubscriptionLoading,
    selectSubscriptionError,
    selectPaymentDetails,
    selectCurrentSubscription,
    selectSubscriptionSuccess,
    selectSubscriptionMessage,
    resetState
} from '../../../redux/slices/subscriptionSlice';

const SubscriptionPlans = () => {
    const dispatch = useDispatch();
    const plans = useSelector(selectSubscriptionPlans);
    const loading = useSelector(selectSubscriptionLoading);
    const error = useSelector(selectSubscriptionError);
    const paymentDetails = useSelector(selectPaymentDetails);
    const currentSubscription = useSelector(selectCurrentSubscription);
    const success = useSelector(selectSubscriptionSuccess);
    const message = useSelector(selectSubscriptionMessage);
    
    const [razorpayLoaded, setRazorpayLoaded] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState({
        status: null, // 'success', 'error', 'processing'
        message: ''
    });
    const [errorObject, setErrorObject] = useState(null);

    useEffect(() => {
        dispatch(fetchActivePlans());
        
        // Get current subscription for the manager
        const managerId = localStorage.getItem('userId');
        if (managerId) {
            // We need to handle 404 responses appropriately in the subscription slice
            dispatch(fetchManagerSubscription(managerId))
                .unwrap()
                .catch(err => {
                    // Just log the error - we expect 404 when no subscription exists
                    console.log('No active subscription found:', err);
                });
        }
        
        // Check if Razorpay is loaded
        if (window.Razorpay) {
            setRazorpayLoaded(true);
        } else {
            // Load Razorpay script if not available
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.onload = () => setRazorpayLoaded(true);
            document.body.appendChild(script);
        }
        
        return () => {
            dispatch(resetState());
            setErrorObject(null);
        };
    }, [dispatch]);

    // Only show success message when subscription is verified, not on component mount
    useEffect(() => {
        if (success && message) {
            setPaymentStatus({
                status: 'success',
                message: message
            });
        }
    }, [success, message]);

    // Handle UI when subscription is verified
    useEffect(() => {
        if (currentSubscription?.status === "ACTIVE" && paymentDetails) {
            setPaymentStatus({
                status: 'success',
                message: 'Your subscription has been successfully activated!'
            });
        }
    }, [currentSubscription, paymentDetails]);

    const handleSubscribe = async (planId) => {
        try {
            setPaymentStatus({
                status: 'processing',
                message: 'Processing your subscription request...'
            });
            
            const managerId = localStorage.getItem('userId');
            
            // 1. Initiate subscription
            const subscription = await dispatch(initiateSubscription({ 
                managerId, 
                planId 
            })).unwrap();
            
            // 2. Initiate payment
            const payment = await dispatch(initiatePayment({
                subscriptionId: subscription.id,
                amount: subscription.amount,
                currency: 'INR'
            })).unwrap();
            
            if (!razorpayLoaded) {
                setPaymentStatus({
                    status: 'error',
                    message: 'Payment gateway is not ready. Please refresh the page and try again.'
                });
                return;
            }
            
            // 3. Open Razorpay checkout
            const options = {
                key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_key',
                amount: subscription.amount * 100, // amount in paisa
                currency: 'INR',
                name: 'MovieBuff',
                description: 'Theater Manager Subscription',
                order_id: payment.orderId || payment.id,
                handler: function (response) {
                    // Ensure all required fields are included in the verification request
                    const verificationData = {
                        razorpayOrderId: response.razorpay_order_id,
                        razorpayPaymentId: response.razorpay_payment_id,
                        razorpaySignature: response.razorpay_signature,
                        subscriptionId: subscription.id
                    };
                    
                    // Check that all required fields are present
                    if (!verificationData.razorpayOrderId || !verificationData.razorpayPaymentId || !verificationData.razorpaySignature) {
                        setPaymentStatus({
                            status: 'error',
                            message: 'Payment verification failed: Missing payment information from gateway.'
                        });
                        return;
                    }
                    
                    setPaymentStatus({
                        status: 'processing',
                        message: 'Verifying payment...'
                    });
                    
                    dispatch(verifyPayment(verificationData));
                },
                prefill: {
                    name: 'Theater Manager',
                    email: localStorage.getItem('userEmail')
                },
                theme: {
                    color: '#6366f1'
                },
                modal: {
                    ondismiss: function() {
                        setPaymentStatus({
                            status: 'error',
                            message: `Payment was canceled. Please try again when you're ready.`
                        });
                    }
                }
            };
            
            const razorpay = new window.Razorpay(options);
            razorpay.on('payment.failed', function (response) {
                setPaymentStatus({
                    status: 'error',
                    message: `Payment failed: ${response.error.description || 'An error occurred during payment processing.'}`
                });
            });
            
            razorpay.open();
            
        } catch (error) {
            console.error('Subscription Error:', error);
            setPaymentStatus({
                status: 'error',
                message: error.message || 'Failed to process subscription. Please try again later.'
            });
        }
    };

    const renderPaymentStatusAlert = () => {
        if (!paymentStatus.status) return null;
        
        let variant;
        let icon;
        
        switch (paymentStatus.status) {
            case 'success':
                variant = 'success';
                icon = <Check size={18} className="me-2" />;
                break;
            case 'error':
                variant = 'danger';
                icon = <AlertCircle size={18} className="me-2" />;
                break;
            case 'processing':
                variant = 'info';
                icon = <Spinner size="sm" animation="border" className="me-2" />;
                break;
            default:
                variant = 'secondary';
                icon = null;
        }
        
        return (
            <Alert 
                variant={variant} 
                dismissible 
                onClose={() => setPaymentStatus({ status: null, message: '' })}
                className="mb-4 d-flex align-items-center"
            >
                {icon}
                <div>{paymentStatus.message}</div>
            </Alert>
        );
    };

    // Check if the current plan is active
    const isPlanActive = (planId) => {
        return currentSubscription?.planId === planId && currentSubscription?.status === "ACTIVE";
    };
    
    // Check if any subscription is active (to disable all buttons)
    const hasActiveSubscription = () => {
        return currentSubscription && currentSubscription.status === "ACTIVE";
    };

    // Format date to readable format
    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        } catch (error) {
            console.error("Error formatting date:", error);
            return 'Invalid date';
        }
    };

    if (loading && plans.length === 0) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <Spinner animation="border" className="text-primary" />
            </Container>
        );
    }

    return (
        <Container fluid className="py-5 px-4">
            {typeof error === 'string' && error && (
                <Alert variant="danger" dismissible onClose={() => dispatch(resetState())} className="mb-4">
                    <div className="d-flex align-items-center">
                        <AlertCircle size={18} className="me-2" />
                        <div>{error}</div>
                    </div>
                </Alert>
            )}
            
            {renderPaymentStatusAlert()}
            
            {currentSubscription && currentSubscription.status === "ACTIVE" ? (
                <Alert variant="info" className="mb-4">
                    <div className="d-flex align-items-center mb-2">
                        <Award size={18} className="me-2" />
                        <h5 className="mb-0">Active Subscription</h5>
                    </div>
                    <p className="mb-1">You have an active subscription plan. Details:</p>
                    <ul className="list-unstyled ms-3 mb-0">
                        <li className="d-flex align-items-center mb-1">
                            <Calendar size={16} className="me-2 text-muted" />
                            <span>Start Date: {formatDate(currentSubscription.startDate)}</span>
                        </li>
                        <li className="d-flex align-items-center mb-1">
                            <Calendar size={16} className="me-2 text-muted" />
                            <span>End Date: {formatDate(currentSubscription.endDate)}</span>
                        </li>
                        <li className="d-flex align-items-center">
                            <Tag size={16} className="me-2 text-muted" />
                            <span>Amount: ₹{currentSubscription.amount?.toFixed(2) || '0.00'}</span>
                        </li>
                    </ul>
                </Alert>
            ) : null}
            
            <h2 className="text-center mb-4 fw-bold">Subscription Plans</h2>
            <p className="text-center text-muted mb-5">Choose the perfect plan for your theater management needs</p>
            
            {plans.length === 0 ? (
                <Alert variant="info">
                    <div className="d-flex align-items-center">
                        <AlertCircle size={18} className="me-2" />
                        <div>No subscription plans are currently available. Please check back later.</div>
                    </div>
                </Alert>
            ) : (
                <Row className="justify-content-center g-4">
                    {plans.map((plan) => {
                        const isActive = isPlanActive(plan.id);
                        return (
                            <Col key={plan.id} md={6} lg={4} xl={3} className="mb-4">
                                <Card 
                                    className={`h-100 shadow-sm border-0 transition-transform ${isActive ? 'border-primary' : ''}`}
                                    style={{ 
                                        transition: 'all 0.3s ease',
                                        transform: isActive ? 'scale(1.03)' : '',
                                        borderRadius: '12px',
                                    }}
                                >
                                    {isActive && (
                                        <div className="position-absolute top-0 start-50 translate-middle">
                                            <Badge 
                                                bg="primary"
                                                className="px-3 py-2 rounded-pill"
                                                style={{ zIndex: 10 }}
                                            >
                                                Current Plan
                                            </Badge>
                                        </div>
                                    )}
                                    <Card.Header 
                                        className="text-center border-0 pt-4"
                                        style={{ 
                                            background: 'transparent',
                                            borderTopLeftRadius: '12px',
                                            borderTopRightRadius: '12px'
                                        }}
                                    >
                                        <h3 className="fw-bold text-primary">{plan.name}</h3>
                                    </Card.Header>
                                    <Card.Body className="d-flex flex-column">
                                        <div className="text-center mb-4">
                                            <div className="d-flex justify-content-center align-items-baseline">
                                                <span className="fs-1 fw-bold">₹{plan.price?.toFixed(2) || '0.00'}</span>
                                                <span className="text-muted ms-2">/{plan.duration?.toLowerCase() || 'month'}</span>
                                            </div>
                                        </div>
                                        <Card.Text className="text-center text-muted mb-4">{plan.description}</Card.Text>
                                        <div className="flex-grow-1 mb-4">
                                            <ul className="list-unstyled">
                                                {plan.features && plan.features.map((feature, index) => (
                                                    <li key={index} className="mb-3 d-flex align-items-center">
                                                        <div 
                                                            className="d-flex justify-content-center align-items-center me-3"
                                                            style={{
                                                                width: '24px',
                                                                height: '24px',
                                                                borderRadius: '50%',
                                                                backgroundColor: 'rgba(99, 102, 241, 0.1)'
                                                            }}
                                                        >
                                                            <Check size={14} color="#6366f1" />
                                                        </div>
                                                        <span>{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <Button 
                                            variant={isActive ? "outline-primary" : "primary"}
                                            className="w-100 py-2 rounded-pill"
                                            onClick={() => handleSubscribe(plan.id)}
                                            disabled={paymentStatus.status === 'processing' || !razorpayLoaded || isActive}
                                        >
                                            {paymentStatus.status === 'processing' ? (
                                                <>
                                                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                                                    Processing...
                                                </>
                                            ) : isActive ? (
                                                <div className="d-flex align-items-center justify-content-center">
                                                    <Clock size={16} className="me-2" />
                                                    <span>Active Plan</span>
                                                </div>
                                            ) : hasActiveSubscription() ? (
                                                <div className="d-flex align-items-center justify-content-center">
                                                    <Clock size={16} className="me-2" />
                                                    <span>Subscription Active</span>
                                                </div>
                                            ) : (
                                                'Subscribe Now'
                                            )}
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}
        </Container>
    );
};

export default SubscriptionPlans;