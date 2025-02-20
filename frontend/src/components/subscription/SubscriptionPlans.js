// src/components/subscription/SubscriptionPlans.js
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { Check } from 'lucide-react';
import {
    fetchActivePlans,
    initiateSubscription,
    selectSubscriptionPlans,
    selectSubscriptionLoading,
    selectSubscriptionError,
    selectPaymentDetails
} from '../../redux/slices/subscriptionSlice';
import subscriptionService from '../../services/subscriptionService';

const SubscriptionPlans = () => {
    const dispatch = useDispatch();
    const plans = useSelector(selectSubscriptionPlans);
    const loading = useSelector(selectSubscriptionLoading);
    const error = useSelector(selectSubscriptionError);
    const paymentDetails = useSelector(selectPaymentDetails);

    useEffect(() => {
        dispatch(fetchActivePlans());
    }, [dispatch]);

    const handleSubscribe = async (planId) => {
        try {
            const managerId = localStorage.getItem('userId');
            const result = await dispatch(initiateSubscription({ managerId, planId })).unwrap();
            
            // Initialize Razorpay with test mode
            const options = {
                key: process.env.REACT_APP_RAZORPAY_KEY_ID, // Make sure this is your test key
                amount: result.amount * 100, // amount in paisa
                currency: "INR",
                name: "MovieBuff",
                description: "Theater Manager Subscription",
                order_id: result.orderId,
                handler: async function (response) {
                    console.log('Payment Success:', response);
                    try {
                        const verificationResult = await subscriptionService.verifyPayment({
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature
                        });
                        console.log('Verification Result:', verificationResult);
                        alert('Subscription activated successfully!');
                    } catch (error) {
                        console.error('Verification Error:', error);
                        alert('Payment verification failed');
                    }
                },
                prefill: {
                    name: "Theater Manager",
                    email: localStorage.getItem('userEmail')
                },
                theme: {
                    color: "#3399cc"
                },
                modal: {
                    ondismiss: function() {
                        console.log('Payment modal closed');
                    }
                }
            };
    
            console.log('Razorpay Options:', options);
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response){
                console.error('Payment Failed:', response.error);
                alert(`Payment Failed: ${response.error.description}`);
            });
            rzp.open();
        } catch (error) {
            console.error('Subscription Error:', error);
            alert('Error initiating subscription');
        }
    };

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <Spinner animation="border" />
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="py-4">
                <Alert variant="danger">
                    {error}
                </Alert>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <h2 className="text-center mb-4">Select a Subscription Plan</h2>
            <Row className="justify-content-center">
                {plans.map((plan) => (
                    <Col key={plan.id} md={6} lg={4} className="mb-4">
                        <Card className="h-100 shadow-sm">
                            <Card.Header className="text-center bg-primary text-white">
                                <h3 className="my-2">{plan.name}</h3>
                            </Card.Header>
                            <Card.Body className="d-flex flex-column">
                                <div className="text-center mb-4">
                                    <h4 className="mb-0">₹{plan.price}</h4>
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
                                >
                                    Subscribe Now
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </Container>
    );
};

export default SubscriptionPlans;