import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
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
  CloseButton
} from 'react-bootstrap';
import { Upload, Image as ImageIcon, Plus, X } from 'lucide-react';
import { createActor, selectActorLoading, selectActorError } from '../../../redux/slices/actorSlice';
import cloudinaryService from '../../../services/cloudinaryService';
import LanguageSelector from '../common/LanguageSelector';
import './AddActor.css';

const AWARDS = [
  'National Film Award',
  'Filmfare Award',
  'IIFA Award',
  'Screen Award',
  'State Award',
  'International Award'
];

const AddActor = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const loading = useSelector(selectActorLoading);
  const error = useSelector(selectActorError);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    imageUrl: '',
    gender: '',
    description: '',
    dateOfBirth: '',
    languages: [],
    awards: [],
    careerStartDate: '',
    isProfile: true
  });

  // Image upload state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [imageUploaded, setImageUploaded] = useState(false);

  // Other state
  const [customAward, setCustomAward] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) { // 5MB limit
        setImageError('Image size should be less than 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setImageError('');
      setImageUploaded(false); // Reset image uploaded flag when new image is selected
    }
  };

  // Handle image upload
  const handleImageUpload = async () => {
    if (!imageFile) return null;
    
    setUploadingImage(true);
    setImageError('');

    try {
      const result = await cloudinaryService.uploadImage(imageFile, 'actors');
      
      // Update the form data with the image URL
      setFormData(prev => ({ ...prev, imageUrl: result.url }));
      setImageUploaded(true);
      
      return result.url;
    } catch (error) {
      setImageError('Failed to upload image. Please try again.');
      console.error('Image upload error:', error);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setValidationErrors(prev => ({ ...prev, [name]: '' }));
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle language selection with the new component
  const handleLanguageChange = (selectedLangs) => {
    setFormData(prev => ({ ...prev, languages: selectedLangs.map(lang => lang.name) }));
    setValidationErrors(prev => ({ ...prev, languages: '' }));
  };

  // Handle award selection
  const handleAwardSelect = (award) => {
    setFormData(prev => ({
      ...prev,
      awards: prev.awards.includes(award) 
        ? prev.awards.filter(a => a !== award)
        : [...prev.awards, award]
    }));
  };

  // Add custom award
  const handleAddCustomAward = () => {
    if (customAward.trim()) {
      setFormData(prev => ({
        ...prev,
        awards: [...prev.awards, customAward.trim()]
      }));
      setCustomAward('');
    }
  };

  // Remove award
  const handleRemoveAward = (award) => {
    setFormData(prev => ({
      ...prev,
      awards: prev.awards.filter(a => a !== award)
    }));
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.gender) errors.gender = 'Gender is required';
    if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
    if (formData.languages.length === 0) errors.languages = 'Select at least one language';
    if (!formData.description.trim()) errors.description = 'Description is required';
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Upload image if not already uploaded
    let imageUrl = formData.imageUrl;
    if (imageFile && !imageUploaded) {
      const uploadedUrl = await handleImageUpload();
      if (!uploadedUrl) {
        // If image upload failed, don't proceed
        return;
      }
      imageUrl = uploadedUrl;
    }

    // Create the final form data with the image URL
    const finalFormData = {
      ...formData,
      imageUrl
    };

    try {
      await dispatch(createActor(finalFormData)).unwrap();
      navigate('/admin/actors');
    } catch (error) {
      console.error('Failed to create actor:', error);
    }
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="page-title">Add New Actor</h2>
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
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview('');
                          setFormData(prev => ({ ...prev, imageUrl: '' }));
                          setImageUploaded(false);
                        }}
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
                  <Alert variant="danger" className="mt-2">
                    {imageError}
                  </Alert>
                )}
                {imageUploaded && (
                  <Alert variant="success" className="mt-2">
                    Image uploaded successfully
                  </Alert>
                )}
                {uploadingImage && (
                  <div className="text-center mt-2">
                    <Spinner animation="border" size="sm" /> Uploading...
                  </div>
                )}
                {imageFile && !imageUploaded && !uploadingImage && (
                  <Button 
                    variant="primary" 
                    className="mt-2 w-100"
                    onClick={handleImageUpload}
                  >
                    Upload Image
                  </Button>
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
                  <LanguageSelector
                    selectedLanguages={formData.languages.map(lang => ({ name: lang, code: lang.toLowerCase().substring(0, 2) }))}
                    onChange={handleLanguageChange}
                    isInvalid={!!validationErrors.languages}
                    errorMessage={validationErrors.languages}
                  />
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
                    {AWARDS.map(award => (
                      <Form.Check
                        key={award}
                        type="checkbox"
                        label={award}
                        checked={formData.awards.includes(award)}
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
                    {formData.awards.map(award => (
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
                    onClick={() => navigate('/admin/actors')}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={loading || uploadingImage}
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Saving...
                      </>
                    ) : 'Save Actor'}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>
    </Container>
  );
};

export default AddActor;