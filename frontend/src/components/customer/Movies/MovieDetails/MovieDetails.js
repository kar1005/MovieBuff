import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Star, 
  Clock, 
  Calendar, 
  Tag, 
  Globe, 
  Video, 
  Share2
} from 'lucide-react';
import movieService from '../../../../services/movieService';
import actorService from '../../../../services/actorService';
import MovieReviewSection from './MovieReviewSection';
import './MovieDetails.css';

const MovieDetails = () => {
  const navigate = useNavigate();
  const { movieId } = useParams();
  
  const [movie, setMovie] = useState(null);
  const [actors, setActors] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch movie data
  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        setLoading(true);
        
        // Fetch movie details
        const movieData = await movieService.getMovieById(movieId);
        setMovie(movieData);
        
        // Fetch actors associated with this movie
        const actorsData = await actorService.getActorsByMovie(movieId);
        setActors(actorsData);
        
        // Fetch detailed movie statistics
        const statsData = await movieService.getMovieStatistics(movieId);
        setStatistics(statsData);
        
      } catch (err) {
        setError(err.message || 'An error occurred while fetching movie data');
        console.error('Error fetching movie data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();
  }, [movieId]);

  // Format helpers
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  const formatReleaseDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleBookTickets = () => {
    navigate(`/customer/theaters/movie/${movieId}`);
  };

  const handleWatchTrailer = () => {
    if (movie?.trailerUrl) {
      window.open(movie.trailerUrl, '_blank');
    }
  };

  const handleActorClick = (actorId) => {
    navigate(`/customer/actor/${actorId}`);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: movie.title,
        text: `Check out ${movie.title} movie!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <span>Loading movie details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="error-container">
        <p>Movie not found</p>
      </div>
    );
  }

  return (
    <div className="movie-details-container">
      <div className="movie-hero" style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.9)), url(${movie.posterUrl})` }}>
        <div className="movie-hero-content">
          <div className="movie-poster-container">
            <img src={movie.posterUrl} alt={movie.title} className="movie-poster" />
          </div>
          <div className="movie-info">
            <h1 className="movie-title">{movie.title}</h1>
            
            <div className="movie-meta">
              {movie.rating && (
                <div className="rating">
                  <Star fill="#FFC107" stroke="#FFC107" size={20} />
                  <span>{movie.rating.average}/10</span>
                  <span className="vote-count">({movie.rating.count} votes)</span>
                </div>
              )}
              
              <div className="meta-item">
                <Clock size={16} />
                <span>{formatDuration(movie.duration)}</span>
              </div>
              
              <div className="meta-item">
                <Calendar size={16} />
                <span>{formatReleaseDate(movie.releaseDate)}</span>
              </div>
              
              <div className="meta-item">
                <Tag size={16} />
                <span>{movie.grade}</span>
              </div>
            </div>
            
            <div className="movie-attributes">
              <div className="attribute-section">
                <h3>Genres</h3>
                <div className="tags">
                  {movie.genres.map((genre, index) => (
                    <span key={index} className="tag">{genre}</span>
                  ))}
                </div>
              </div>
              
              <div className="attribute-section">
                <h3>Languages</h3>
                <div className="tags">
                  {movie.languages.map((language, index) => (
                    <span key={index} className="tag">{language}</span>
                  ))}
                </div>
              </div>
              
              <div className="attribute-section">
                <h3>Experience</h3>
                <div className="tags">
                  {movie.experience.map((exp, index) => (
                    <span key={index} className="tag">{exp}</span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="action-buttons">
              <button className="book-button" onClick={handleBookTickets}>Book tickets</button>
              <button className="trailer-button" onClick={handleWatchTrailer}>
                <Video size={16} />
                Watch Trailer
              </button>
              <button className="share-button" onClick={handleShare}>
                <Share2 size={16} />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="movie-content">
        <section className="about-section">
          <h2>About the movie</h2>
          <p>{movie.description}</p>
        </section>

        <section className="cast-section">
          <h2>Cast</h2>
          <div className="cast-list">
            {actors.map((actor) => (
              <div key={actor.id} className="cast-member" onClick={() => handleActorClick(actor.id)}>
                <img 
                  src={actor.imageUrl || '/api/placeholder/120/120'} 
                  alt={actor.name} 
                  className="cast-image" 
                />
                <div className="cast-info">
                  <h4 className="actor-name">{actor.name}</h4>
                  {/* Find the character name from movie's cast array */}
                  {movie.cast.find(c => c.actorId === actor.id) && (
                    <>
                      <p className="character-name">
                        as {movie.cast.find(c => c.actorId === actor.id).characterName}
                      </p>
                      <span className="role-tag">
                        {movie.cast.find(c => c.actorId === actor.id).role}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {statistics && (
          <section className="stats-section">
            <h2>Movie Statistics</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <h4>Total Bookings</h4>
                <p>{statistics.totalBookings?.toLocaleString() || 'N/A'}</p>
              </div>
              <div className="stat-item">
                <h4>Revenue</h4>
                <p>${statistics.revenue?.toLocaleString() || 'N/A'}</p>
              </div>
              <div className="stat-item">
                <h4>Popularity Score</h4>
                <p>{statistics.popularityScore?.toFixed(1) || 'N/A'}</p>
              </div>
              {statistics.otherMetrics && Object.entries(statistics.otherMetrics).map(([key, value]) => (
                <div key={key} className="stat-item">
                  <h4>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h4>
                  <p>{typeof value === 'number' ? value.toLocaleString() : value}</p>
                </div>
              ))}
            </div>
          </section>
        )}
        
        {movie.cast && movie.cast.length > 0 && (
          <section className="filmography-preview">
            <h2>Actor Filmographies</h2>
            <div className="filmography-links">
              {movie.cast.slice(0, 5).map((castMember) => (
                <button 
                  key={castMember.actorId} 
                  className="filmography-button"
                  onClick={() => navigate(`/customer/actor/${castMember.actorId}`)}
                >
                  View {castMember.name}'s Filmography
                </button>
              ))}
              {movie.cast.length > 5 && (
                <p className="more-actors">+ {movie.cast.length - 5} more actors</p>
              )}
            </div>
          </section>
        )}
        
        {/* Include Movie Review Section component */}
        <MovieReviewSection movieId={movieId} />
      </div>
    </div>
  );
};

export default MovieDetails;