import React, { useState } from 'react';
import './AddMovie.css';
import { Calendar } from 'lucide-react';

const AddMovie = ({handleClick}) => {
  const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dpxjljx7i/image/upload";
  const UPLOAD_PRESET = "movies-poster-upload";

  const initialFormState = {
    title: '',
    languages: [],
    genres: [],
    experience: [],
    cast: [],
    description: '',
    duration: '',
    grade: '',
    releaseDate: '',
    posterUrl: '',
    trailerUrl: '',
    status: 'UPCOMING',
    rating: {
      average: 0,
      count: 0
    },
    statistics: {
      totalBookings: 0,
      revenue: 0,
      popularityScore: 0
    }
  };

  const [formData, setFormData] = useState(initialFormState);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayInput = (e, field) => {
    const value = e.target.value.split(',').map(item => item.trim());
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageLoading(true);
    const formDataImage = new FormData();
    formDataImage.append('file', file);
    formDataImage.append('upload_preset', UPLOAD_PRESET);
    formDataImage.append('folder', 'movie-posters'); // Specify folder for upload

    try {
      const response = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formDataImage
      });
      const data = await response.json();
      setFormData(prev => ({
        ...prev,
        posterUrl: data.secure_url
      }));
    } catch (err) {
      setError('Failed to upload image');
    } finally {
      setImageLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.posterUrl) {
      setError('Please upload a poster image');
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/movies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create movie');
      }else{
        handleClick('movies');
      }
      
      // Reset form on success
      setFormData(initialFormState);
      setError(null);
      // You might want to add a success message or redirect here
    } catch (err) {
      setError(err.message);
    }
  };

  const renderFormField = (label, name, type = 'text', options = null) => {
    if (type === 'array') {
      return (
        <div className="form-group">
          <label className="form-label">{label} (comma-separated)</label>
          <input
            type="text"
            required
            value={formData[name].join(', ')}
            onChange={(e) => handleArrayInput(e, name)}
            className="form-input"
          />
        </div>
      );
    }

    if (type === 'select' && options) {
      return (
        <div className="form-group">
          <label className="form-label">{label}</label>
          <select
            name={name}
            value={formData[name]}
            onChange={handleChange}
            className="form-select"
          >
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (type === 'textarea') {
      return (
        <div className="form-group">
          <label className="form-label">{label}</label>
          <textarea
            name={name}
            required
            value={formData[name]}
            onChange={handleChange}
            rows="4"
            className="form-textarea"
          />
        </div>
      );
    }

    return (
      <div className="form-group">
        <label className="form-label">{label}</label>
        <input
          type={type}
          name={name}
          required
          value={formData[name]}
          onChange={handleChange}
          className="form-input"
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <div className="card">
        <div className="card-body">
          <h2 className="page-title">Add New Movie</h2>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {renderFormField('Title', 'title')}
              {renderFormField('Duration (minutes)', 'duration', 'number')}
              {renderFormField('Languages', 'languages', 'array')}
              {renderFormField('Genres', 'genres', 'array')}
              {renderFormField('Experience', 'experience', 'array')}
              {renderFormField('Cast', 'cast', 'array')}
              {renderFormField('Grade', 'grade')}
              {renderFormField('Release Date', 'releaseDate', 'date')}
              {renderFormField('Trailer URL', 'trailerUrl', 'url')}
              {renderFormField('Status', 'status', 'select', [
                { value: 'UPCOMING', label: 'Upcoming' },
                { value: 'NOW_SHOWING', label: 'Now Showing' },
                { value: 'ENDED', label: 'Ended' }
              ])}
            </div>

            {renderFormField('Description', 'description', 'textarea')}

            <div className="form-group">
              <label className="form-label">Movie Poster</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="file-upload"
              />
              {imageLoading && <p className="loading-text">Uploading image...</p>}
              {formData.posterUrl && (
                <div className="image-preview">
                  <img
                    src={formData.posterUrl}
                    alt="Movie poster preview"
                  />
                </div>
              )}
            </div>

            <div className="button-container">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={imageLoading}
                className="btn btn-primary"
              >
                {imageLoading ? 'Uploading...' : 'Create Movie'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddMovie;