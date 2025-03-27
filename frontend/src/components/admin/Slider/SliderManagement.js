import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import cloudinaryService from './../../../services/cloudinaryService';
import { Card, Button, Form, Table } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const SliderManagement = () => {
    const [sliderImages, setSliderImages] = useState([]);
    const [newImage, setNewImage] = useState({
      title: '',
      file: null,
      description: ''
    });
    const [uploadErrors, setUploadErrors] = useState([]);
    const fileInputRef = useRef(null);
    axios.defaults.baseURL = 'http://localhost:8080';
  
    // Fetch slider images
    const fetchSliderImages = async () => {
      try {
        const response = await axios.get('/api/slider');
        setSliderImages(response.data);
      } catch (error) {
        console.error('Failed to fetch slider images', error);
      }
    };
  
    // Initial fetch
    useEffect(() => {
      fetchSliderImages();
    }, []);
  
    // Handle file selection
    const handleFileSelect = (event) => {
      const file = event.target.files[0];
      if (file) {
        // Validate image
        const validationResult = cloudinaryService.validateImage(file);
        
        if (validationResult.isValid) {
          setNewImage(prev => ({
            ...prev,
            file: file
          }));
          setUploadErrors([]);
        } else {
          setUploadErrors(validationResult.errors);
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      }
    };
  
    // Handle image upload
    const handleImageUpload = async () => {
      if (!newImage.file || !newImage.title) {
        setUploadErrors(['Please select an image and provide a title']);
        return;
      }

      try {
        // Upload image via cloudinaryService
        const uploadResult = await cloudinaryService.uploadImage(
          newImage.file, 
          'slider_images' // Optional folder name
        );

        // Create slider entry with Cloudinary URL
        const sliderData = {
          title: newImage.title,
          imageUrl: uploadResult.url,
          cloudinaryPublicId: uploadResult.publicId,
          description: newImage.description || ''
        };

        // Save to backend
        await axios.post('/api/slider', sliderData);

        // Reset form and refresh images
        setNewImage({ title: '', file: null, description: '' });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        fetchSliderImages();
      } catch (error) {
        console.error('Failed to upload image', error);
        setUploadErrors(['Failed to upload image']);
      }
    };
  
    // Handle image replacement
    const handleReplaceImage = async (imageId, file) => {
      try {
        // Validate image
        const validationResult = cloudinaryService.validateImage(file);
        
        if (!validationResult.isValid) {
          setUploadErrors(validationResult.errors);
          return;
        }

        // Find existing image to get current Cloudinary public ID
        const existingImage = sliderImages.find(img => img.id === imageId);
        
        // Delete existing Cloudinary image if public ID exists
        if (existingImage?.cloudinaryPublicId) {
          await cloudinaryService.deleteImage(existingImage.cloudinaryPublicId);
        }

        // Upload new image
        const uploadResult = await cloudinaryService.uploadImage(
          file, 
          'slider_images'
        );

        // Update slider entry
        const updatedSliderData = {
          ...existingImage,
          imageUrl: uploadResult.url,
          cloudinaryPublicId: uploadResult.publicId
        };

        // Save updated image to backend
        await axios.put(`/api/slider/${imageId}`, updatedSliderData);

        fetchSliderImages();
      } catch (error) {
        console.error('Failed to replace image', error);
        setUploadErrors(['Failed to replace image']);
      }
    };
  
    // Handle image deletion
    const handleDeleteImage = async (imageId) => {
      try {
        // Find existing image to get Cloudinary public ID
        const existingImage = sliderImages.find(img => img.id === imageId);
        
        // Delete from Cloudinary if public ID exists
        if (existingImage?.cloudinaryPublicId) {
          await cloudinaryService.deleteImage(existingImage.cloudinaryPublicId);
        }

        // Delete from backend
        await axios.delete(`/api/slider/${imageId}`);
        
        fetchSliderImages();
      } catch (error) {
        console.error('Failed to delete image', error);
      }
    };
  
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Slider Image Management</h1>
        
        {/* Add New Slider Image Form */}
        <Card className="mb-6">
          <Card.Body>
            <Form>
              {uploadErrors.length > 0 && (
                <div className="text-danger mb-4">
                  {uploadErrors.map((error, index) => (
                    <p key={index}>{error}</p>
                  ))}
                </div>
              )}
              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Image Title"
                  value={newImage.title}
                  onChange={(e) => setNewImage({
                    ...newImage, 
                    title: e.target.value
                  })}
                />
              </Form.Group>
              
              <Form.Group className="mb-3 d-flex">
                <Form.Control
                  type="text"
                  placeholder="Selected File"
                  value={newImage.file ? newImage.file.name : 'No file selected'}
                  readOnly
                />
                <Form.Control 
                  type="file" 
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileSelect}
                  className="d-none"
                  id="fileInput"
                />
                <Button 
                  variant="outline-secondary" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose File
                </Button>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Description (Optional)"
                  value={newImage.description}
                  onChange={(e) => setNewImage({
                    ...newImage, 
                    description: e.target.value
                  })}
                />
              </Form.Group>
              
              <Button 
                variant="primary"
                onClick={handleImageUpload}
                disabled={!newImage.file || !newImage.title}
              >
                Add Slider Image
              </Button>
            </Form>
          </Card.Body>
        </Card>
  
        {/* Slider Images Table */}
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Thumbnail</th>
              <th>Title</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sliderImages.map((image) => (
              <tr key={image.id}>
                <td>
                  <img 
                    src={cloudinaryService.getOptimizedUrl(image.imageUrl, { width: 160, height: 90 })} 
                    alt={image.title} 
                    className="img-thumbnail"
                    style={{ width: '160px', height: '90px', objectFit: 'cover' }}
                  />
                </td>
                <td>{image.title}</td>
                <td>
                  <div className="d-flex gap-2">
                    <Form.Control 
                      type="file" 
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="d-none" 
                      id={`replace-${image.id}`}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          handleReplaceImage(image.id, file);
                        }
                      }}
                    />
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => {
                        const fileInput = document.getElementById(`replace-${image.id}`);
                        fileInput?.click();
                      }}
                    >
                      Replace
                    </Button>
                    <Button 
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteImage(image.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };
  
  export default SliderManagement;