import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectUserCity, selectUserCoordinates } from '../../../../redux/slices/locationSlice';
import './TheatreList.css';
import theaterService from '../../../../services/theaterService';

export default function TheatreList() {
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const userCity = useSelector(selectUserCity);
  const userCoordinates = useSelector(selectUserCoordinates);
  const navigate = useNavigate();
  
  // Function to fetch all theaters based on city/location
  const fetchTheaters = async () => {
    try {
      setLoading(true);
      
      const data = await theaterService.getTheatersByCity(userCity);
      setTheaters(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching theaters:', err);
      setError(err.message);
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (userCity) {
      fetchTheaters();
    } else {
      setError('Please select a location to view theaters');
      setLoading(false);
    }
  }, [userCity, userCoordinates]);
  
  const handleTheaterClick = (theaterId) => {
    navigate(`/customer/theater/${theaterId}`);
  };
  
  const renderAmenities = (amenities) => {
    if (!amenities || amenities.length === 0) return null;
    
    return (
      <div className="theater-amenities">
        {amenities.map((amenity, index) => (
          <span key={index} className="amenity-badge">
            {amenity}
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="theater-list-container">
        <div className="theater-loading">
          <div className="loading-spinner"></div>
          <p>Loading theaters...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="theater-list-container">
        <div className="theater-error">
          <h3>Oops!</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (theaters.length === 0) {
    return (
      <div className="theater-list-container">
        <div className="no-theaters">
          <h3>No theaters found in {userCity}</h3>
          <p>We couldn't find any theaters in your selected location.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="theater-list-container">
      <div className="all-theater-list-header">
        <h2>
          All theaters in
          <span className="city-name"> {userCity}</span>
        </h2>
      </div>
      
      <div className="theaters-list">
        {theaters.map((theater) => (
          <div 
            key={theater.id} 
            className="theater-card"
            onClick={() => handleTheaterClick(theater.id)}
          >
            <div className="theater-card-header">
              <h3 className="theater-name">{theater.name}</h3>
              <span className={`theater-status ${theater.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                {theater.status}
              </span>
            </div>
            
            <div className="theater-location">
              {theater.location && (
                <>
                  <p>{theater.location.address}</p>
                  <p>{theater.location.city}, {theater.location.state} {theater.location.zipCode}</p>
                  {theater.location.googleLink && (
                    <a 
                      href={theater.location.googleLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="google-maps-link"
                    >
                      View on Google Maps
                    </a>
                  )}
                </>
              )}
            </div>
            
            <div className="theater-info-row">
              <div className="theater-details">
                <div className="detail-item">
                  <span className="detail-label">Screens:</span>
                  <span className="detail-value">{theater.totalScreens || (theater.screens && theater.screens.length) || 0}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Contact:</span>
                  <span className="detail-value">{theater.phoneNumber || 'N/A'}</span>
                </div>
              </div>
              
              {renderAmenities(theater.amenities)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}