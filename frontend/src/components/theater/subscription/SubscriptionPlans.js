import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Alert,
  Badge,
} from "react-bootstrap";
import { Check, AlertCircle, Award, Calendar, Tag, Clock } from "lucide-react";
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
  resetState,
} from "../../../redux/slices/subscriptionSlice";
import theaterService from "../../../services/theaterService";

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
    status: null,
    message: "",
  });
  const [managerId, setManagerId] = useState(null); // Add state for managerId
  const [processingPlanId, setProcessingPlanId] = useState(null); // Track which plan is being processed

  useEffect(() => {
    dispatch(fetchActivePlans());

    // Get theater ID and fetch theater details to get manager ID
    const theaterId =
      localStorage.getItem("theaterid") ||
      localStorage.getItem("theaterId") ||
      localStorage.getItem("theater_id");

    console.log("Theater ID from localStorage:", theaterId);

    if (theaterId) {
      // Fetch theater details to get manager ID from the API response
      console.log("Fetching theater details using theaterService...");

      theaterService
        .getTheaterById(theaterId)
        .then((theater) => {
          console.log("Theater details received:", theater);

          if (theater.managerId) {
            setManagerId(theater.managerId);
            console.log(
              "Manager ID found in theater response:",
              theater.managerId
            );

            // Fetch manager subscription
            dispatch(fetchManagerSubscription(theater.managerId))
              .unwrap()
              .catch((err) => {
                console.log("No active subscription found:", err);
              });
          } else {
            console.error("No manager ID found in theater details!");
            setPaymentStatus({
              status: "error",
              message: "Manager information not found. Please contact support.",
            });
          }
        })
        .catch((error) => {
          console.error("Failed to fetch theater details:", error);
          setPaymentStatus({
            status: "error",
            message: "Failed to load theater information. Please try again.",
          });
        });
    } else {
      console.error("No Theater ID found in localStorage!");
      setPaymentStatus({
        status: "error",
        message: "Session expired. Please login again.",
      });
    }

    // Check if Razorpay is loaded
    if (window.Razorpay) {
      setRazorpayLoaded(true);
    } else {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => setRazorpayLoaded(true);
      document.body.appendChild(script);
    }

    return () => {
      dispatch(resetState());
    };
  }, [dispatch]);

  useEffect(() => {
    if (success && message) {
      setProcessingPlanId(null); // Reset processing state on success
      setPaymentStatus({
        status: "success",
        message: message,
      });
    }
  }, [success, message]);

  useEffect(() => {
    if (currentSubscription?.status === "ACTIVE" && paymentDetails) {
      setProcessingPlanId(null); // Reset processing state on success
      setPaymentStatus({
        status: "success",
        message: "Your subscription has been successfully activated!",
      });
    }
  }, [currentSubscription, paymentDetails]);

  const handleSubscribe = async (planId) => {
    try {
      setProcessingPlanId(planId); // Set the specific plan being processed
      setPaymentStatus({
        status: "processing",
        message: "Processing your subscription request...",
      });

      const currentManagerId = managerId;
      console.log("HandleSubscribe - Manager ID:", currentManagerId);
      console.log("HandleSubscribe - Plan ID:", planId);

      if (!currentManagerId) {
        setProcessingPlanId(null); // Reset processing state
        setPaymentStatus({
          status: "error",
          message: "Manager ID not found. Please login again.",
        });
        return;
      }

      if (!planId) {
        setProcessingPlanId(null); // Reset processing state
        setPaymentStatus({
          status: "error",
          message: "Invalid plan selected. Please try again.",
        });
        return;
      }

      console.log("Sending subscription request with:", {
        managerId: currentManagerId,
        planId,
      });

      const subscription = await dispatch(
        initiateSubscription({
          managerId: currentManagerId,
          planId: planId,
        })
      ).unwrap();

      console.log("Subscription created:", subscription);

      const payment = await dispatch(
        initiatePayment({
          subscriptionId: subscription.id,
          amount: subscription.amount,
          currency: "INR",
        })
      ).unwrap();

      console.log("Payment initiated:", payment);

      if (!razorpayLoaded) {
        setPaymentStatus({
          status: "error",
          message:
            "Payment gateway is not ready. Please refresh the page and try again.",
        });
        return;
      }

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || "rzp_test_key",
        amount: subscription.amount * 100,
        currency: "INR",
        name: "MovieBuff",
        description: "Theater Manager Subscription",
        order_id: payment.orderId || payment.id,
        handler: function (response) {
          console.log("Payment response:", response);

          const verificationData = {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            subscriptionId: subscription.id,
          };

          if (
            !verificationData.razorpayOrderId ||
            !verificationData.razorpayPaymentId ||
            !verificationData.razorpaySignature
          ) {
            setPaymentStatus({
              status: "error",
              message:
                "Payment verification failed: Missing payment information from gateway.",
            });
            return;
          }

          setPaymentStatus({
            status: "processing",
            message: "Verifying payment...",
          });

          dispatch(verifyPayment(verificationData));
        },
        prefill: {
          name: "Theater Manager",
          email: localStorage.getItem("userEmail"),
        },
        theme: {
          color: "#6366f1",
        },
        modal: {
          ondismiss: function () {
            setPaymentStatus({
              status: "error",
              message:
                "Payment was canceled. Please try again when you're ready.",
            });
          },
        },
      };

      console.log("Opening Razorpay with options:", options);
      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", function (response) {
        console.error("Payment failed:", response);
        setProcessingPlanId(null); // Reset processing state
        setPaymentStatus({
          status: "error",
          message: `Payment failed: ${
            response.error.description ||
            "An error occurred during payment processing."
          }`,
        });
      });

      razorpay.open();
    } catch (error) {
      console.error("Subscription Error:", error);

      let errorMessage =
        "Failed to process subscription. Please try again later.";

      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      setPaymentStatus({
        status: "error",
        message: errorMessage,
      });
    }
  };

  const renderPaymentStatusAlert = () => {
    if (!paymentStatus.status) return null;

    let variant;
    let icon;

    switch (paymentStatus.status) {
      case "success":
        variant = "success";
        icon = <Check size={18} className="me-2" />;
        break;
      case "error":
        variant = "danger";
        icon = <AlertCircle size={18} className="me-2" />;
        break;
      case "processing":
        variant = "info";
        icon = <Spinner size="sm" animation="border" className="me-2" />;
        break;
      default:
        variant = "secondary";
        icon = null;
    }

    return (
      <Alert
        variant={variant}
        dismissible
        onClose={() => setPaymentStatus({ status: null, message: "" })}
        className="mb-4 d-flex align-items-center"
      >
        {icon}
        <div>{paymentStatus.message}</div>
      </Alert>
    );
  };

  const isPlanActive = (planId) => {
    return (
      currentSubscription?.planId === planId &&
      currentSubscription?.status === "ACTIVE"
    );
  };

  const hasActiveSubscription = () => {
    return currentSubscription && currentSubscription.status === "ACTIVE";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  if (loading && plans.length === 0) {
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <Spinner animation="border" className="text-primary" />
      </Container>
    );
  }

  return (
    <Container fluid className="py-5 px-4">
      {typeof error === "string" && error && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => dispatch(resetState())}
          className="mb-4"
        >
          <div className="d-flex align-items-center">
            <AlertCircle size={18} className="me-2" />
            <div>{error}</div>
          </div>
        </Alert>
      )}

      {renderPaymentStatusAlert()}

      {/* {process.env.NODE_ENV === "development" && (
        <Alert variant="warning" className="mb-4">
          <small>
            Debug Info: Theater ID ={" "}
            {localStorage.getItem("theaterid") ||
              localStorage.getItem("theaterId") ||
              localStorage.getItem("theater_id") ||
              "NOT FOUND"}{" "}
            | Manager ID = {managerId || "LOADING..."}
          </small>
        </Alert>
      )} */}

      {currentSubscription && currentSubscription.status === "ACTIVE" && (
        <Alert variant="info" className="mb-4">
          <div className="d-flex align-items-center mb-2">
            <Award size={18} className="me-2" />
            <h5 className="mb-0">Active Subscription</h5>
          </div>
          <p className="mb-1">You have an active subscription plan. Details:</p>
          <ul className="list-unstyled ms-3 mb-0">
            <li className="d-flex align-items-center mb-1">
              <Calendar size={16} className="me-2 text-muted" />
              <span>
                Start Date: {formatDate(currentSubscription.startDate)}
              </span>
            </li>
            <li className="d-flex align-items-center mb-1">
              <Calendar size={16} className="me-2 text-muted" />
              <span>End Date: {formatDate(currentSubscription.endDate)}</span>
            </li>
            <li className="d-flex align-items-center">
              <Tag size={16} className="me-2 text-muted" />
              <span>
                Amount: ₹{currentSubscription.amount?.toFixed(2) || "0.00"}
              </span>
            </li>
          </ul>
        </Alert>
      )}

      <h2 className="text-center mb-4 fw-bold">Subscription Plans</h2>
      <p className="text-center text-muted mb-5">
        Choose the perfect plan for your theater management needs
      </p>

      {plans.length === 0 ? (
        <Alert variant="info">
          <div className="d-flex align-items-center">
            <AlertCircle size={18} className="me-2" />
            <div>
              No subscription plans are currently available. Please check back
              later.
            </div>
          </div>
        </Alert>
      ) : (
        <Row className="justify-content-center g-4">
          {plans.map((plan) => {
            const isActive = isPlanActive(plan.id);
            return (
              <Col key={plan.id} md={6} lg={4} xl={3} className="mb-4">
                <Card
                  className={`h-100 shadow-sm border-0 transition-transform ${
                    isActive ? "border-primary" : ""
                  }`}
                  style={{
                    transition: "all 0.3s ease",
                    transform: isActive ? "scale(1.03)" : "",
                    borderRadius: "12px",
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
                      background: "transparent",
                      borderTopLeftRadius: "12px",
                      borderTopRightRadius: "12px",
                    }}
                  >
                    <h3 className="fw-bold text-primary">{plan.name}</h3>
                  </Card.Header>
                  <Card.Body className="d-flex flex-column">
                    <div className="text-center mb-4">
                      <div className="d-flex justify-content-center align-items-baseline">
                        <span className="fs-1 fw-bold">
                          ₹{plan.price?.toFixed(2) || "0.00"}
                        </span>
                        <span className="text-muted ms-2">
                          /{plan.duration?.toLowerCase() || "month"}
                        </span>
                      </div>
                    </div>
                    <Card.Text className="text-center text-muted mb-4">
                      {plan.description}
                    </Card.Text>
                    <div className="flex-grow-1 mb-4">
                      <ul className="list-unstyled">
                        {plan.features &&
                          plan.features.map((feature, index) => (
                            <li
                              key={index}
                              className="mb-3 d-flex align-items-center"
                            >
                              <div
                                className="d-flex justify-content-center align-items-center me-3"
                                style={{
                                  width: "24px",
                                  height: "24px",
                                  borderRadius: "50%",
                                  backgroundColor: "rgba(99, 102, 241, 0.1)",
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
                      disabled={
                        processingPlanId === plan.id || // Only disable the specific plan being processed
                        !razorpayLoaded ||
                        isActive ||
                        hasActiveSubscription() // Disable all if has active subscription
                      }
                    >
                      {processingPlanId === plan.id ? ( // Show loader only for the specific plan
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            className="me-2"
                          />
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
                        "Subscribe Now"
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
