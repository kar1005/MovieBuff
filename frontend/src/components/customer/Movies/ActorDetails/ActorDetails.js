import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import actorService from './../../../../services/actorService';
import './ActorDetails.css';

const ActorDetails = () => {
  const { id } = useParams();
  const [actor, setActor] = useState(null);
  const [filmography, setFilmography] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [relatedActors, setRelatedActors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActorData = async () => {
      try {
        setLoading(true);
        const actorData = await actorService.getActorById(id);
        setActor(actorData);
  
        // Fetch filmography
        const filmographyData = await actorService.getActorFilmography(id);
        setFilmography(filmographyData);
  
        // Fetch statistics
        const statsData = await actorService.getActorStatistics(id);
        setStatistics(statsData);
  
        // Use the new randomActors endpoint
        const randomActors = await actorService.getRandomActors(5, id);
        setRelatedActors(randomActors);
  
        setLoading(false);
      } catch (err) {
        setError('Failed to load actor details');
        setLoading(false);
        console.error(err);
      }
    };
  
    fetchActorData();
  }, [id]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!actor) return <div className="not-found">Actor not found</div>;

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Calculate age
  const calculateAge = (birthDate) => {
    if (!birthDate) return 'N/A';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Get career span
  const getCareerSpan = () => {
    if (!actor.careerStartDate) return 'N/A';
    const startYear = new Date(actor.careerStartDate).getFullYear();
    const currentYear = new Date().getFullYear();
    return `${startYear} - Present (${currentYear - startYear} years)`;
  };

  return (
    <div className="actor-details-container">
      <div className="actor-header">
        <div className="actor-image-container">
          <img 
            src={actor.imageUrl || '/default-actor.png'} 
            alt={actor.name} 
            className="actor-image"
          />
        </div>
        <div className="actor-info">
          <h1>{actor.name}</h1>
          {actor.gender && (
            <p className="actor-occupation">
              {actor.gender === 'MALE' ? 'Actor' : 'Actress'}
              {actor.filmography?.length > 0 && ` • ${actor.filmography.length} Films`}
            </p>
          )}
          
          <div className="actor-metadata">
            <div className="metadata-row">
              <span className="metadata-label">Born:</span>
              <span className="metadata-value">{formatDate(actor.dateOfBirth)} ({calculateAge(actor.dateOfBirth)} years)</span>
            </div>
            
            <div className="metadata-row">
              <span className="metadata-label">Birthplace:</span>
              <span className="metadata-value">{statistics.birthplace || 'N/A'}</span>
            </div>
            
            <div className="metadata-row">
              <span className="metadata-label">Career:</span>
              <span className="metadata-value">{getCareerSpan()}</span>
            </div>
            
            <div className="metadata-row">
              <span className="metadata-label">Languages:</span>
              <span className="metadata-value">{actor.languages?.join(', ') || 'N/A'}</span>
            </div>
          </div>
          
          <div className="share-button">
            <button>Share</button>
          </div>
        </div>
      </div>
      
      <div className="actor-content">
        <div className="actor-section">
          <h2>About</h2>
          <p className="actor-description">{actor.description || 'No description available.'}</p>
          {actor.awards && actor.awards.length > 0 && (
            <div className="awards-section">
              <h3>Awards</h3>
              <ul className="awards-list">
                {actor.awards.map((award, index) => (
                  <li key={index}>{award}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="read-more">
            <a href="#">Read More</a>
          </div>
        </div>
        
        <div className="actor-section">
          <h2>Filmography</h2>
          <div className="filmography-list">
            {filmography && filmography.length > 0 ? (
              filmography
                .sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))
                .map((movie) => (
                  <div key={movie.movieId} className="movie-item">
                    <div className="movie-year">
                      {movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'N/A'}
                    </div>
                    <div className="movie-details">
                      <Link to={`/movies/${movie.movieId}`} className="movie-title">
                        {movie.movieTitle}
                      </Link>
                      <div className="movie-role">
                        {movie.characterName && <span>as {movie.characterName}</span>}
                        {movie.role && <span className="role-tag">{movie.role}</span>}
                      </div>
                    </div>
                    {movie.movieRating && (
                      <div className="movie-rating">
                        <span className="star">★</span> {movie.movieRating.toFixed(1)}
                      </div>
                    )}
                  </div>
                ))
            ) : (
              <p>No filmography available.</p>
            )}
          </div>
        </div>
        
        <div className="actor-section">
          <h2>Peers & More</h2>
          <div className="related-actors">
            {relatedActors.slice(0, 5).map((actor) => (
              <Link to={`/actors/${actor.id}`} key={actor.id} className="related-actor">
                <div className="related-actor-image">
                  <img src={actor.imageUrl || '/default-actor.png'} alt={actor.name} />
                </div>
                <div className="related-actor-name">{actor.name}</div>
                <div className="related-actor-label">Actor</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActorDetails;