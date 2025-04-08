import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { Check, AlertCircle } from 'lucide-react';
import {
    fetchActivePlans,
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

    useEffect(() => {
        dispatch(fetchActivePlans());
        
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
        };
    }, [dispatch]);

    // Reset payment status when subscription state changes
    useEffect(() => {
        if (currentSubscription?.status === "ACTIVE") {
            setPaymentStatus({
                status: 'success',
                message: 'Your subscription has been successfully activated!'
            });
        }
    }, [currentSubscription]);

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
                    color: '#3399cc'
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
        switch (paymentStatus.status) {
            case 'success':
                variant = 'success';
                break;
            case 'error':
                variant = 'danger';
                break;
            case 'processing':
                variant = 'info';
                break;
            default:
                variant = 'secondary';
        }
        
        return (
            <Alert 
                variant={variant} 
                dismissible 
                onClose={() => setPaymentStatus({ status: null, message: '' })}
                className="mb-4"
            >
                {paymentStatus.status === 'error' && (
                    <AlertCircle size={18} className="me-2" />
                )}
                {paymentStatus.message}
            </Alert>
        );
    };

    if (loading && plans.length === 0) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <Spinner animation="border" />
            </Container>
        );
    }

    return (
        <Container className="py-5">
            {error && (
                <Alert variant="danger" dismissible onClose={() => dispatch(resetState())}>
                    {error}
                </Alert>
            )}
            
            {renderPaymentStatusAlert()}
            
            <h2 className="text-center mb-4">Select a Subscription Plan</h2>
            
            {plans.length === 0 ? (
                <Alert variant="info">
                    No subscription plans are currently available. Please check back later.
                </Alert>
            ) : (
                <Row className="justify-content-center">
                    {plans.map((plan) => (
                        <Col key={plan.id} md={6} lg={4} className="mb-4">
                            <Card className="h-100 shadow-sm">
                                <Card.Header className="text-center bg-primary text-white">
                                    <h3 className="my-2">{plan.name}</h3>
                                </Card.Header>
                                <Card.Body className="d-flex flex-column">
                                    <div className="text-center mb-4">
                                        <h4 className="mb-0">₹{plan.price?.toFixed(2) || '0.00'}</h4>
                                        <small className="text-muted">/{plan.duration?.toLowerCase() || 'month'}</small>
                                    </div>
                                    <Card.Text>{plan.description}</Card.Text>
                                    <div className="flex-grow-1">
                                        <ul className="list-unstyled">
                                            {plan.features && plan.features.map((feature, index) => (
                                                <li key={index} className="mb-2 d-flex align-items-center">
                                                    <Check size={18} color="green" className="me-2" />
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <Button 
                                        variant="primary" 
                                        className="w-100 mt-3"
                                        onClick={() => handleSubscribe(plan.id)}
                                        disabled={!razorpayLoaded || paymentStatus.status === 'processing'}
                                    >
                                        {paymentStatus.status === 'processing' ? (
                                            <>
                                                <Spinner as="span" animation="border" size="sm" className="me-2" />
                                                Processing...
                                            </>
                                        ) : (
                                            'Subscribe Now'
                                        )}
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </Container>
    );
};

export default SubscriptionPlans;