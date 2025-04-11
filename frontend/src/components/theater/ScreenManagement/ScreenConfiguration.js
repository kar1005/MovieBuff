// src/pages/theater/ScreenConfiguration.js
import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Form,
  Button,
  Row,
  Col,
  Alert,
  Spinner
} from "react-bootstrap";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Monitor, Film, Volume2, Projector, X, CheckCircle2 } from "lucide-react";
import { fetchTheaterById } from "../../../redux/slices/theaterSlice";

const ScreenConfiguration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { theaterId: urlTheaterId, screenId } = useParams();

  // Get theaterId either from URL or state
  const theaterId = urlTheaterId || location.state?.theaterId;

  const currentTheater = useSelector((state) => state.theater.currentTheater);
  const loading = useSelector((state) => state.theater.loading);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const experiences = [
    { value: "2D", label: "2D", icon: <Film size={18} /> },
    { value: "3D", label: "3D", icon: <Film size={18} /> },
    { value: "IMAX", label: "IMAX", icon: <Monitor size={18} /> },
    { value: "4DX", label: "4DX", icon: <Monitor size={18} /> },
    { value: "Dolby", label: "Dolby Cinema", icon: <Volume2 size={18} /> },
  ];

  // Screen configuration state - align with backend DTO structure
  const [screenConfig, setScreenConfig] = useState({
    screenNumber: "",
    screenName: "",
    supportedExperiences: [],
    features: {  // Changed from screenFeatures to features to match DTO
      screenWidth: 0,
      screenHeight: 0,
      projectorType: "",
      soundSystem: ""
    },
    totalSeats: 0,
    isActive: true
  });

  // Fetch theater data
  useEffect(() => {
    if (theaterId) {
      dispatch(fetchTheaterById(theaterId));
    }
  }, [dispatch, theaterId]);

  // Initialize or fetch screen data when currentTheater is loaded
  useEffect(() => {
    if (currentTheater && screenId) {
      const screen = currentTheater.screens?.find(
        (screen) => screen.screenNumber === parseInt(screenId, 10)
      );
      
      if (screen) {
        console.log("Initializing with existing screen:", screen);
        initializeExistingScreen(screen);
      }
    }
  }, [currentTheater, screenId]);

  useEffect(() => {
    // Only auto-assign screen number for new screens
    if (!screenId && currentTheater && currentTheater.screens) {
      // Find the highest screen number
      const screenNumbers = currentTheater.screens.map(screen => screen.screenNumber);
      const maxScreenNumber = screenNumbers.length > 0 ? Math.max(...screenNumbers) : 0;
      // Set the next screen number
      setScreenConfig(prev => ({
        ...prev,
        screenNumber: maxScreenNumber + 1
      }));
    }
  }, [currentTheater, screenId]);

  // Initialize existing screen data
  const initializeExistingScreen = (screen) => {
    setScreenConfig({
      screenNumber: screen.screenNumber || "",
      screenName: screen.screenName || "",
      supportedExperiences: screen.supportedExperiences || [],
      features: {
        screenWidth: screen.features?.screenWidth || 0,
        screenHeight: screen.features?.screenHeight || 0,
        projectorType: screen.features?.projectorType || "",
        soundSystem: screen.features?.soundSystem || ""
      },
      totalSeats: screen.totalSeats || 0,
      isActive: screen.isActive !== undefined ? screen.isActive : true
    });
  };

  const handleProceedToDesign = () => {
    if (!screenConfig.screenName || !screenConfig.screenNumber) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    // Proceed to design screen with config data
    navigate(`/manager/theaters/${theaterId}/screens/${screenId ? screenId + '/edit' : 'add'}/design`, {
      state: { screenConfig }
    });
  };

  const handleCancel = () => {
    navigate(`/manager/theaters/${theaterId}/screens`);
  };

  const handleExperienceToggle = (experienceValue) => {
    setScreenConfig((prev) => ({
      ...prev,
      supportedExperiences: prev.supportedExperiences.includes(experienceValue)
        ? prev.supportedExperiences.filter(e => e !== experienceValue)
        : [...prev.supportedExperiences, experienceValue]
    }));
  };

  // If theaterId is not available, redirect or show error
  if (!theaterId) {
    return (
      <Container fluid className="py-4">
        <Alert variant="danger">
          Theater ID is required. Please select a theater first.
        </Alert>
      </Container>
    );
  }


  return (
    <Container fluid className="p-0">
      {error && (
        <Alert
          variant="danger"
          className="mb-4 mx-3"
          onClose={() => setError("")}
          dismissible
        >
          {error}
        </Alert>
      )}

      <Row className="m-0">
        <Col xs={12} className="p-0">
          <Card className="shadow-sm border-0 rounded-0">
            <Card.Header className="bg-primary text-white d-flex align-items-center py-3 px-4">
              <Monitor size={22} className="me-2" />
              <h5 className="mb-0 fw-semibold">
                {screenId ? "Edit Screen Configuration" : "Add New Screen"}
              </h5>
            </Card.Header>
            <Card.Body className="p-4 p-lg-5">
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Loading screen data...</p>
                </div>
              ) : (
                <Form className="mx-auto" style={{ maxWidth: "1200px" }}>
                  <Row className="mb-4 gx-4">
                    <Col lg={6} className="mb-3 mb-lg-0">
                      <Form.Group>
                        <Form.Label className="fw-medium">Screen Name*</Form.Label>
                        <Form.Control
                          type="text"
                          value={screenConfig.screenName}
                          onChange={(e) =>
                            setScreenConfig((prev) => ({
                              ...prev,
                              screenName: e.target.value,
                            }))
                          }
                          placeholder="e.g., IMAX Screen 1"
                          className="py-2"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col lg={6}>
                    <Form.Group>
  <Form.Label className="fw-medium">Screen Number*</Form.Label>
  <Form.Control
    type="number"
    value={screenConfig.screenNumber}
    onChange={(e) =>
      setScreenConfig((prev) => ({
        ...prev,
        screenNumber: parseInt(e.target.value, 10) || "",
      }))
    }
    min="1"
    className="py-2"
    required
    disabled={true} // Always disabled now that it's auto-assigned
    readOnly
  />
  <Form.Text className="text-muted">
    Screen number is automatically assigned
  </Form.Text>
</Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-medium d-block mb-3">
                      Supported Experiences
                    </Form.Label>
                    <Row className="g-3">
                      {experiences.map((exp) => (
                        <Col xs={6} sm={4} xl={20} key={exp.value}>
                          <Card 
                            onClick={() => handleExperienceToggle(exp.value)}
                            className={`cursor-pointer h-100 ${
                              screenConfig.supportedExperiences.includes(exp.value)
                                ? "border-primary bg-primary bg-opacity-10"
                                : "border"
                            }`}
                            style={{ cursor: "pointer" }}
                          >
                            <Card.Body className="p-3 d-flex align-items-center justify-content-center">
                              <div className="me-2">
                                {screenConfig.supportedExperiences.includes(exp.value) ? (
                                  <CheckCircle2 size={20} className="text-primary" />
                                ) : (
                                  exp.icon
                                )}
                              </div>
                              <span>{exp.label}</span>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </Form.Group>

                  <div className="mb-4">
                    <h6 className="fw-semibold mb-3">
                      <Projector size={18} className="me-2" />
                      Screen Features
                    </h6>
                    <Card className="bg-light border-0">
                      <Card.Body className="p-3 p-sm-4">
                        <Row className="mb-4 gx-4">
                          <Col md={6} className="mb-3 mb-md-0">
                            <Form.Label className="fw-medium">Width (m)</Form.Label>
                            <Form.Control
                              type="number"
                              placeholder="Width (m)"
                              value={screenConfig.features.screenWidth}
                              onChange={(e) =>
                                setScreenConfig((prev) => ({
                                  ...prev,
                                  features: {
                                    ...prev.features,
                                    screenWidth: parseFloat(e.target.value) || 0,
                                  },
                                }))
                              }
                              className="py-2"
                            />
                          </Col>
                          <Col md={6}>
                            <Form.Label className="fw-medium">Height (m)</Form.Label>
                            <Form.Control
                              type="number"
                              placeholder="Height (m)"
                              value={screenConfig.features.screenHeight}
                              onChange={(e) =>
                                setScreenConfig((prev) => ({
                                  ...prev,
                                  features: {
                                    ...prev.features,
                                    screenHeight: parseFloat(e.target.value) || 0,
                                  },
                                }))
                              }
                              className="py-2"
                            />
                          </Col>
                        </Row>

                        <Row className="gx-4">
                          <Col md={6} className="mb-3 mb-md-0">
                            <Form.Group>
                              <Form.Label className="fw-medium">Projector Type</Form.Label>
                              <Form.Control
                                type="text"
                                value={screenConfig.features.projectorType}
                                onChange={(e) =>
                                  setScreenConfig((prev) => ({
                                    ...prev,
                                    features: {
                                      ...prev.features,
                                      projectorType: e.target.value,
                                    },
                                  }))
                                }
                                placeholder="e.g., Laser 4K"
                                className="py-2"
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label className="fw-medium">Sound System</Form.Label>
                              <Form.Control
                                type="text"
                                value={screenConfig.features.soundSystem}
                                onChange={(e) =>
                                  setScreenConfig((prev) => ({
                                    ...prev,
                                    features: {
                                      ...prev.features,
                                      soundSystem: e.target.value,
                                    },
                                  }))
                                }
                                placeholder="e.g., Dolby Atmos"
                                className="py-2"
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </div>

                  <Form.Group className="mb-4">
                    <div className="d-flex align-items-center">
                      <Form.Check 
                        type="switch"
                        id="screen-active-switch"
                        label="Screen Active"
                        checked={screenConfig.isActive}
                        onChange={(e) => setScreenConfig(prev => ({
                          ...prev,
                          isActive: e.target.checked
                        }))}
                        className="me-3"
                      />
                      <Form.Text className="text-muted">
                        Inactive screens won't be available for show scheduling
                      </Form.Text>
                    </div>
                  </Form.Group>

                  <hr className="my-4" />

                  <div className="d-flex flex-column flex-md-row justify-content-md-end mt-4 gap-3">
                    <Button
                      variant="outline-secondary"
                      onClick={handleCancel}
                      disabled={loading || isSubmitting}
                      className="px-4 py-2 order-md-1 order-2"
                    >
                      <X size={18} className="me-2" />
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleProceedToDesign}
                      disabled={loading || isSubmitting}
                      className="px-4 py-2 order-md-2 order-1"
                      size="lg"
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Processing...
                        </>
                      ) : (
                        <>Proceed to Screen Design</>
                      )}
                    </Button>
                  </div>
                </Form>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ScreenConfiguration;