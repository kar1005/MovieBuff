import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
  Badge,
  CloseButton,
  Modal,
} from "react-bootstrap";
import { Upload, Image as ImageIcon, Plus, X, Save } from "lucide-react";
import {
  fetchActorById,
  updateActor,
  uploadActorImage,
  deleteActorImage,
  selectCurrentActor,
  selectActorLoading,
  selectActorError,
} from "../../../redux/slices/actorSlice";
import cloudinaryService from "../../../services/cloudinaryService";
import "./EditActor.css";

const LANGUAGES = [
  "Hindi",
  "English",
  "Tamil",
  "Telugu",
  "Malayalam",
  "Kannada",
  "Bengali",
];
const AWARDS = [
  "National Film Award",
  "Filmfare Award",
  "IIFA Award",
  "Screen Award",
  "State Award",
  "International Award",
];

// Default empty form state
const defaultFormState = {
  name: "",
  imageUrl: "",
  gender: "",
  description: "",
  dateOfBirth: "",
  languages: [],
  awards: [],
  careerStartDate: "",
  isProfile: true,
};

const EditActor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux states with safe fallbacks
  const actor = useSelector(selectCurrentActor) || {};
  const loading = useSelector(selectActorLoading);
  const error = useSelector(selectActorError);

  // Form state with safe initialization
  const [formData, setFormData] = useState(defaultFormState);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const [oldImagePublicId, setOldImagePublicId] = useState(null);
  const [customAward, setCustomAward] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Modal states
  const [showDeleteImageModal, setShowDeleteImageModal] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Load actor data
  useEffect(() => {
    if (id) {
      dispatch(fetchActorById(id));
    }
  }, [dispatch, id]);

  // Safely update form data when actor data is loaded
  useEffect(() => {
    if (actor && Object.keys(actor).length > 0) {
      const formattedData = {
        ...defaultFormState, // Include defaults for all fields
        ...actor, // Overlay with any existing actor data
        // Safely format dates if they exist
        dateOfBirth: actor.dateOfBirth
          ? new Date(actor.dateOfBirth).toISOString().split("T")[0]
          : "",
        careerStartDate: actor.careerStartDate
          ? new Date(actor.careerStartDate).toISOString().split("T")[0]
          : "",
        // Ensure arrays are always initialized
        languages: actor.languages || [],
        awards: actor.awards || [],
        // Ensure string fields are never null
        name: actor.name || "",
        imageUrl: actor.imageUrl || "",
        gender: actor.gender || "",
        description: actor.description || "",
      };

      setFormData(formattedData);

      // Set image preview if exists
      if (actor.imageUrl) {
        setImagePreview(actor.imageUrl);
        const publicId = cloudinaryService.getPublicIdFromUrl(actor.imageUrl);
        if (publicId) {
          setOldImagePublicId(publicId);
        }
      }
    }
  }, [actor]);

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const { isValid, errors } = cloudinaryService.validateImage(file);
    if (!isValid) {
      setImageError(errors[0]);
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageError("");
    setHasChanges(true);
  };

  // Handle image upload
  const handleImageUpload = async () => {
    if (!imageFile) return null;
    setUploadingImage(true);
    setImageError("");

    try {
      const result = await cloudinaryService.uploadImage(imageFile, "actors");
      return result.url;
    } catch (error) {
      setImageError("Failed to upload image. Please try again.");
      console.error("Image upload error:", error);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle image deletion
  const handleDeleteImage = async () => {
    try {
      if (oldImagePublicId) {
        await dispatch(deleteActorImage(oldImagePublicId)).unwrap();
      }
      setImagePreview("");
      setImageFile(null);
      setFormData((prev) => ({ ...prev, imageUrl: "" }));
      setOldImagePublicId(null);
      setHasChanges(true);
    } catch (error) {
      console.error("Failed to delete image:", error);
      setImageError("Failed to delete image. Please try again.");
    }
    setShowDeleteImageModal(false);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    setFormData((prev) => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  // Handle language selection
  const handleLanguageChange = (e) => {
    const value = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setFormData((prev) => ({ ...prev, languages: value }));
    setValidationErrors((prev) => ({ ...prev, languages: "" }));
    setHasChanges(true);
  };

  // Handle award selection
  const handleAwardSelect = (award) => {
    setFormData((prev) => ({
      ...prev,
      awards: prev.awards.includes(award)
        ? prev.awards.filter((a) => a !== award)
        : [...prev.awards, award],
    }));
    setHasChanges(true);
  };

  // Handle custom award addition
  const handleAddCustomAward = () => {
    if (customAward.trim()) {
      setFormData((prev) => ({
        ...prev,
        awards: [...(prev.awards || []), customAward.trim()],
      }));
      setCustomAward("");
      setHasChanges(true);
    }
  };

  // Handle award removal
  const handleRemoveAward = (award) => {
    setFormData((prev) => ({
      ...prev,
      awards: (prev.awards || []).filter((a) => a !== award),
    }));
    setHasChanges(true);
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    if (!formData.name?.trim()) errors.name = "Name is required";
    if (!formData.gender) errors.gender = "Gender is required";
    if (!formData.dateOfBirth) errors.dateOfBirth = "Date of birth is required";
    if (!formData.languages?.length)
      errors.languages = "Select at least one language";
    if (!formData.description?.trim())
      errors.description = "Description is required";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      let updatedImageUrl = formData.imageUrl;
      if (imageFile) {
        updatedImageUrl = await handleImageUpload();
        if (!updatedImageUrl) return;
      }

      const updatedData = {
        ...formData,
        imageUrl: updatedImageUrl,
        // Ensure proper data structure
        languages: formData.languages || [],
        awards: formData.awards || [],
        isProfile: true, // Always set to true when editing
      };

      await dispatch(
        updateActor({
          id,
          actorData: updatedData,
          oldImagePublicId: oldImagePublicId,
        })
      ).unwrap();

      setShowSuccessModal(true);
    } catch (error) {
      console.error("Failed to update actor:", error);
    }
  };

  // Handle navigation
  const handleNavigateAway = () => {
    if (hasChanges) {
      setShowUnsavedModal(true);
    } else {
      navigate("/admin/actors");
    }
  };

  if (loading && !Object.keys(actor).length) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="page-title">Edit Actor: {formData.name}</h2>
        </Col>
      </Row>

      <Form onSubmit={handleSubmit}>
        <Row>
          {/* Image Upload Section */}
          <Col md={4} className="mb-4">
            <Card className="image-upload-card">
              <Card.Body>
                <div className="image-upload-container">
                  {imagePreview ? (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Preview" />
                      <Button
                        variant="link"
                        className="remove-image"
                        onClick={() => setShowDeleteImageModal(true)}
                      >
                        <X size={24} />
                      </Button>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <ImageIcon size={48} />
                      <p>Click or drag image to upload</p>
                      <small className="text-muted">Max size: 5MB</small>
                    </div>
                  )}
                  <input
                    type="file"
                    className="file-input"
                    accept="image/*"
                    onChange={handleImageSelect}
                  />
                </div>
                {imageError && (
                  <Alert variant="danger" className="mt-2 mb-0">
                    {imageError}
                  </Alert>
                )}
                {uploadingImage && (
                  <div className="text-center mt-2">
                    <Spinner animation="border" size="sm" /> Uploading...
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Actor Details Section */}
          <Col md={8}>
            <Card>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Name*</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        isInvalid={!!validationErrors.name}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.name}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Gender*</Form.Label>
                      <Form.Select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        isInvalid={!!validationErrors.gender}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.gender}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date of Birth*</Form.Label>
                      <Form.Control
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        isInvalid={!!validationErrors.dateOfBirth}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.dateOfBirth}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Career Start Date</Form.Label>
                      <Form.Control
                        type="date"
                        name="careerStartDate"
                        value={formData.careerStartDate}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Languages*</Form.Label>
                  <Form.Select
                    multiple
                    name="languages"
                    value={formData.languages}
                    onChange={handleLanguageChange}
                    isInvalid={!!validationErrors.languages}
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Hold Ctrl/Cmd to select multiple languages
                  </Form.Text>
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.languages}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description*</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.description}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.description}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Awards</Form.Label>
                  <div className="awards-container">
                    {AWARDS.map((award) => (
                      <Form.Check
                        key={award}
                        type="checkbox"
                        id={`award-${award}`}
                        label={award}
                        checked={formData.awards?.includes(award)}
                        onChange={() => handleAwardSelect(award)}
                        className="award-checkbox"
                      />
                    ))}
                  </div>

                  <div className="custom-award-input">
                    <Form.Control
                      type="text"
                      placeholder="Add custom award"
                      value={customAward}
                      onChange={(e) => setCustomAward(e.target.value)}
                    />
                    <Button
                      variant="outline-primary"
                      onClick={handleAddCustomAward}
                      disabled={!customAward.trim()}
                    >
                      <Plus size={16} />
                    </Button>
                  </div>

                  <div className="selected-awards">
                    {formData.awards?.map((award) => (
                      <Badge key={award} bg="primary" className="award-badge">
                        {award}
                        <CloseButton
                          variant="white"
                          onClick={() => handleRemoveAward(award)}
                        />
                      </Badge>
                    ))}
                  </div>
                </Form.Group>

                {error && (
                  <Alert variant="danger" className="mt-3">
                    {error}
                  </Alert>
                )}

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <Button
                    variant="secondary"
                    onClick={handleNavigateAway}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={loading || !hasChanges}
                    className="btn-save"
                  >
                    {loading ? (
                      <>
                        <Spinner
                          animation="border"
                          size="sm"
                          className="me-2"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} className="me-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>

      {/* Delete Image Modal */}
      <Modal
        show={showDeleteImageModal}
        onHide={() => setShowDeleteImageModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Delete Image</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the current image? This action cannot
          be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteImageModal(false)}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteImage}>
            Delete Image
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Unsaved Changes Modal */}
      <Modal
        show={showUnsavedModal}
        onHide={() => setShowUnsavedModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Unsaved Changes</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          You have unsaved changes. Are you sure you want to leave this page?
          Your changes will be lost.
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowUnsavedModal(false)}
          >
            Stay
          </Button>
          <Button variant="danger" onClick={() => navigate("/admin/actors")}>
            Leave Without Saving
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Success Modal */}
      <Modal
        show={showSuccessModal}
        onHide={() => {
          setShowSuccessModal(false);
          navigate("/admin/actors");
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Success</Modal.Title>
        </Modal.Header>
        <Modal.Body>Actor details have been successfully updated.</Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            onClick={() => {
              setShowSuccessModal(false);
              navigate("/admin/actors");
            }}
          >
            OK
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default EditActor;
