import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { Check } from 'lucide-react';
import {
    fetchActivePlans,
    initiateSubscription,
    initiatePayment,
    verifyPayment,
    selectSubscriptionPlans,
    selectSubscriptionLoading,
    selectSubscriptionError,
    selectPaymentDetails,
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
    const success = useSelector(selectSubscriptionSuccess);
    const message = useSelector(selectSubscriptionMessage);
    
    const [razorpayLoaded, setRazorpayLoaded] = useState(false);

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

    const handleSubscribe = async (planId) => {
        try {
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
                alert('Payment gateway is loading. Please try again in a moment.');
                return;
            }
            
            // 3. Open Razorpay checkout
            const options = {
                key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_key',
                amount: subscription.amount * 100, // amount in paisa
                currency: 'INR',
                name: 'MovieBuff',
                description: 'Theater Manager Subscription',
                order_id: payment.id,
                handler: function (response) {
                    dispatch(verifyPayment({
                        razorpayOrderId: response.razorpay_order_id,
                        razorpayPaymentId: response.razorpay_payment_id,
                        razorpaySignature: response.razorpay_signature
                    }));
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
                        console.log('Payment modal closed');
                    }
                }
            };
            
            const razorpay = new window.Razorpay(options);
            razorpay.on('payment.failed', function (response) {
                console.error('Payment Failed:', response.error);
                alert(`Payment Failed: ${response.error.description}`);
            });
            
            razorpay.open();
            
        } catch (error) {
            console.error('Subscription Error:', error);
        }
    };

    if (loading) {
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
            
            {success && (
                <Alert variant="success" dismissible onClose={() => dispatch(resetState())}>
                    {message}
                </Alert>
            )}
            
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
                                        <h4 className="mb-0">₹{plan.price.toFixed(2)}</h4>
                                        <small className="text-muted">/{plan.duration.toLowerCase()}</small>
                                    </div>
                                    <Card.Text>{plan.description}</Card.Text>
                                    <div className="flex-grow-1">
                                        <ul className="list-unstyled">
                                            {plan.features.map((feature, index) => (
                                                <li key={index} className="mb-2">
                                                    <Check size={18} className="text-success me-2" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <Button 
                                        variant="primary" 
                                        className="w-100 mt-3"
                                        onClick={() => handleSubscribe(plan.id)}
                                        disabled={!razorpayLoaded}
                                    >
                                        Subscribe Now
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