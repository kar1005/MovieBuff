import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Form,
  Button,
  Row,
  Col,
  Tab,
  Nav,
  Alert,
} from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import TheaterLayoutDesigner from "./TheaterLayoutDesigner";
import { setScreenLayout } from "../../redux/slices/theaterSlice";

const ScreenSetup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theaters = useSelector((state) => state.theater.theaters);

  const [selectedTheater, setSelectedTheater] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");
  const [screenConfig, setScreenConfig] = useState({
    name: "",
    supportedExperiences: [],
    screenWidth: "",
    screenHeight: "",
    projectorType: "",
    soundSystem: "",
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const experiences = [
    { value: "2D", label: "2D" },
    { value: "3D", label: "3D" },
    { value: "IMAX", label: "IMAX" },
    { value: "4DX", label: "4DX" },
    { value: "Dolby", label: "Dolby Cinema" },
  ];

  const handleExperienceChange = (experience) => {
    const updatedExperiences = screenConfig.supportedExperiences.includes(
      experience
    )
      ? screenConfig.supportedExperiences.filter((exp) => exp !== experience)
      : [...screenConfig.supportedExperiences, experience];

    setScreenConfig({
      ...screenConfig,
      supportedExperiences: updatedExperiences,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // In production, this would be an API call
      dispatch(
        setScreenLayout({
          theaterId: selectedTheater,
          screenNumber: selectedScreen,
          config: screenConfig,
        })
      );

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving screen setup:", error);
    }
  };

  return (
    <Container fluid className="py-4">
      {showSuccess && (
        <Alert variant="success" className="mb-4">
          Screen configuration saved successfully!
        </Alert>
      )}

      <Row>
        <Col md={4} lg={3}>
          <Card className="mb-4">
            <Card.Header>Screen Configuration</Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Select Theater</Form.Label>
                  <Form.Select
                    value={selectedTheater}
                    onChange={(e) => setSelectedTheater(e.target.value)}
                    required
                  >
                    <option value="">Choose theater...</option>
                    {theaters.map((theater) => (
                      <option key={theater.id} value={theater.id}>
                        {theater.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Screen Number</Form.Label>
                  <Form.Select
                    value={selectedScreen}
                    onChange={(e) => setSelectedScreen(e.target.value)}
                    required
                  >
                    <option value="">Select screen...</option>
                    {[...Array(5)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Screen {i + 1}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Screen Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={screenConfig.name}
                    onChange={(e) =>
                      setScreenConfig({
                        ...screenConfig,
                        name: e.target.value,
                      })
                    }
                    placeholder="e.g., IMAX Screen 1"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Supported Experiences</Form.Label>
                  {experiences.map((exp) => (
                    <Form.Check
                      key={exp.value}
                      type="checkbox"
                      label={exp.label}
                      checked={screenConfig.supportedExperiences.includes(
                        exp.value
                      )}
                      onChange={() => handleExperienceChange(exp.value)}
                    />
                  ))}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Screen Dimensions</Form.Label>
                  <Row>
                    <Col>
                      <Form.Control
                        type="number"
                        placeholder="Width (m)"
                        value={screenConfig.screenWidth}
                        onChange={(e) =>
                          setScreenConfig({
                            ...screenConfig,
                            screenWidth: e.target.value,
                          })
                        }
                        required
                      />
                    </Col>
                    <Col>
                      <Form.Control
                        type="number"
                        placeholder="Height (m)"
                        value={screenConfig.screenHeight}
                        onChange={(e) =>
                          setScreenConfig({
                            ...screenConfig,
                            screenHeight: e.target.value,
                          })
                        }
                        required
                      />
                    </Col>
                  </Row>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Projector Type</Form.Label>
                  <Form.Control
                    type="text"
                    value={screenConfig.projectorType}
                    onChange={(e) =>
                      setScreenConfig({
                        ...screenConfig,
                        projectorType: e.target.value,
                      })
                    }
                    placeholder="e.g., Laser 4K"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Sound System</Form.Label>
                  <Form.Control
                    type="text"
                    value={screenConfig.soundSystem}
                    onChange={(e) =>
                      setScreenConfig({
                        ...screenConfig,
                        soundSystem: e.target.value,
                      })
                    }
                    placeholder="e.g., Dolby Atmos"
                    required
                  />
                </Form.Group>

                <div className="d-grid gap-2">
                  <Button variant="primary" type="submit">
                    Save Configuration
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8} lg={9}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Screen Layout Designer</h5>
            </Card.Header>
            <Card.Body>
              <TheaterLayoutDesigner />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ScreenSetup;
