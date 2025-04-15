import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Star, 
  CheckCircle, 
  XCircle, 
  Filter, 
  Search, 
  Eye, 
  ArrowLeft, 
  ArrowRight,
  AlertCircle,
  Check,
  ChevronDown,
  Info,
  Film
} from 'lucide-react';
import { 
  getAllReviews, 
  moderateReview, 
  getReviewById 
} from '../../../redux/slices/reviewSlice';
import { getMovieById, getAllMovies } from '../../../redux/slices/movieSlice';
import { getUserById  } from '../../../redux/slices/userSlice';
import './Reviews.css';

const Reviews = () => {
  const dispatch = useDispatch();
  const { reviews, isLoading, error } = useSelector((state) => state.reviews);
  const { user } = useSelector((state) => state.auth);
  const { movies } = useSelector((state) => state.movies);

  // State
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('FLAGGED'); // Default to show flagged reviews
  const [filterMovie, setFilterMovie] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [movieSearchTerm, setMovieSearchTerm] = useState('');
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [showMovieDropdown, setShowMovieDropdown] = useState(false);
  const [currentReview, setCurrentReview] = useState(null);
  const [moderationNote, setModerationNote] = useState('');
  const [showReviewDetails, setShowReviewDetails] = useState(false);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [currentReportExpanded, setCurrentReportExpanded] = useState(null);
  const [movieDetailsMap, setMovieDetailsMap] = useState({});
  const [userDisplayNames, setUserDisplayNames] = useState({});
  const [userFetchInProgress, setUserFetchInProgress] = useState({});

  // Fetch all reviews and movies when component mounts
  useEffect(() => {
    dispatch(getAllReviews());
    dispatch(getAllMovies({ filters: {}, page: 0, size: 100 })); // Fetch movies with a high limit to get most of them
  }, [dispatch]);

  // Build movie details map when movies array changes
  useEffect(() => {
    if (!movies || !movies.length) return;
    
    const detailsMap = {};
    movies.forEach(movie => {
      if (movie && movie.id) {
        detailsMap[movie.id] = {
          title: movie.title || 'Unknown Title',
          posterUrl: movie.posterUrl || '',
          releaseDate: movie.releaseDate || null,
          rating: movie.rating || null
        };
      }
    });
    
    setMovieDetailsMap(detailsMap);
    setFilteredMovies(movies);
  }, [movies]);

  // Filter reviews when reviews array, filter status, or search term changes
  useEffect(() => {
    if (!reviews || !Array.isArray(reviews)) return;

    let filtered = [...reviews];

    // Filter by status
    if (filterStatus) {
      filtered = filtered.filter(review => review.status === filterStatus);
    }

    // Filter by movie
    if (filterMovie) {
      filtered = filtered.filter(review => review.movieId === filterMovie);
    }

    // Filter by rating
    if (filterRating) {
      const rating = parseInt(filterRating, 10);
      filtered = filtered.filter(review => review.rating === rating);
    }

    // Filter by search term (in content or user display name)
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        review => 
          (review.content?.toLowerCase().includes(lowerSearchTerm) || false) ||
          (review.userDisplayName?.toLowerCase().includes(lowerSearchTerm) || false)
      );
    }

    setFilteredReviews(filtered);
    setPage(1); // Reset to first page when filters change
    
    // Collect unique user IDs to potentially fetch their display names if needed
    const userIds = [...new Set(filtered.map(review => review.userId).filter(Boolean))];
    
    // For this example, we'll just use the existing userDisplayName,
    // but in a real app you might want to fetch user details here
    const displayNames = {};
    filtered.forEach(review => {
      if (review.userId && review.userDisplayName) {
        displayNames[review.userId] = review.userDisplayName;
      }
    });
    
    setUserDisplayNames(displayNames);
    
  }, [reviews, filterStatus, filterMovie, filterRating, searchTerm]);

  // Filter movies when search term changes
  useEffect(() => {
    if (!movies || !Array.isArray(movies)) return;
    
    if (movieSearchTerm.trim() === '') {
      setFilteredMovies(movies);
      return;
    }
    
    const lowerSearchTerm = movieSearchTerm.toLowerCase();
    const filtered = movies.filter(movie => 
      movie.title?.toLowerCase().includes(lowerSearchTerm) || false
    );
    
    setFilteredMovies(filtered);
  }, [movies, movieSearchTerm]);

  // Get unique movie IDs and names for display
  const uniqueMovieOptions = Array.isArray(reviews) ? 
    [...new Set(reviews.map(review => review.movieId))]
      .filter(id => id)  // Remove null/undefined
      .map(id => ({
        id,
        title: movieDetailsMap[id]?.title || id  // Fall back to ID if title not found
      }))
    : [];

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle filter status change
  const handleStatusFilterChange = (e) => {
    setFilterStatus(e.target.value);
  };

  // Handle filter rating change
  const handleRatingFilterChange = (e) => {
    setFilterRating(e.target.value);
  };

  // Handle movie search input change
  const handleMovieSearchChange = (e) => {
    setMovieSearchTerm(e.target.value);
    setShowMovieDropdown(true);
  };

  // Handle movie selection from dropdown
  const handleMovieSelect = (movieId) => {
    setFilterMovie(movieId);
    setMovieSearchTerm(movieDetailsMap[movieId]?.title || '');
    setShowMovieDropdown(false);
  };

  // Clear movie filter
  const clearMovieFilter = () => {
    setFilterMovie('');
    setMovieSearchTerm('');
  };

  // View review details
  const handleViewReview = (review) => {
    // If this is the first time viewing details for this movie, fetch its data
    if (review.movieId && !movieDetailsMap[review.movieId]?.title) {
      dispatch(getMovieById(review.movieId));
    }
    
    setCurrentReview(review);
    setModerationNote('');
    setShowReviewDetails(true);
  };

  // Close review details
  const handleCloseReviewDetails = () => {
    setShowReviewDetails(false);
    setCurrentReview(null);
    setModerationNote('');
  };

  // Handle moderation action (approve or reject)
  const handleModerateReview = (action) => {
    if (!currentReview || !currentReview.id) {
      setNotification({
        show: true,
        message: "Error: Cannot moderate review - review information is missing",
        type: 'error'
      });
      return;
    }
    
    const status = action === 'approve' ? 'APPROVED' : 'REJECTED';
    
    // Make sure user and user.id exist before using them
    const moderatorId = user && user.id ? user.id : 'admin'; // Fallback to 'admin' if user.id doesn't exist
    
    const moderationData = {
      moderatedBy: moderatorId,
      moderationNotes: moderationNote || 'No notes provided',
      status
    };

    console.log("Moderating review:", currentReview.id);
    console.log("Moderation data:", moderationData);
    
    dispatch(moderateReview({
      id: currentReview.id,
      moderationData
    }))
    .unwrap()
    .then(() => {
      setNotification({
        show: true,
        message: `Review ${status === 'APPROVED' ? 'approved' : 'rejected'} successfully`,
        type: 'success'
      });
      
      // Refresh the review list
      dispatch(getAllReviews());
      
      // Update movie rating if a review's status changed
      if (currentReview.movieId) {
        dispatch(getMovieById(currentReview.movieId));
      }
      
      // Close the details view
      handleCloseReviewDetails();
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 5000);
    })
    .catch((err) => {
      console.error("Error moderating review:", err);
      setNotification({
        show: true,
        message: `Error: ${err?.message || 'Failed to process moderation'}`,
        type: 'error'
      });
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 5000);
    });
  };

  // Toggle report details expansion
  const toggleReportDetails = (reportIndex) => {
    if (currentReportExpanded === reportIndex) {
      setCurrentReportExpanded(null);
    } else {
      setCurrentReportExpanded(reportIndex);
    }
  };

  // Close notification
  const closeNotification = () => {
    setNotification({ show: false, message: '', type: '' });
  };

  // Pagination
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageReviews = filteredReviews.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const goToPrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  // Get movie title from ID
  const getMovieTitle = (movieId) => {
    return movieId ? (movieDetailsMap[movieId]?.title || movieId) : 'Unknown Movie';
  };

  // Get user display name
// Update the getUserDisplayName function
const getUserDisplayName = (userId, fallbackName) => {
  if (!userId) return fallbackName || 'Unknown User';
  
  // If we have the display name cached, return it
  if (userDisplayNames[userId]) {
    return userDisplayNames[userId];
  }
  
  // If not, fetch the user details
  if (!userFetchInProgress[userId]) {
    // Prevent multiple fetches for the same user
    userFetchInProgress[userId] = true;
    
    // Dispatch action to fetch user details
    dispatch(getUserById(userId))
      .then(response => {
        // Update the display names with the fetched username
        setUserDisplayNames(prev => ({
          ...prev,
          [userId]: response.payload.username || response.payload.displayName || fallbackName
        }));
        userFetchInProgress[userId] = false;
      })
      .catch(error => {
        console.error(`Failed to fetch user details for ${userId}:`, error);
        userFetchInProgress[userId] = false;
      });
  }
  
  // Return fallback or userId while fetching
  return fallbackName || userId;
};

  // Render star rating
  const renderStarRating = (rating) => {
    rating = rating || 0; // Ensure rating is a number
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            fill={star <= rating ? '#FFC107' : 'none'}
            stroke={star <= rating ? '#FFC107' : '#ccc'}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="review-management-container">
      <h1>Review Management</h1>
      
      {/* Notification banner */}
      {notification.show && (
        <div className={`notification-banner ${notification.type}`}>
          {notification.type === 'success' ? (
            <Check size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span>{notification.message}</span>
          <button className="close-notification" onClick={closeNotification}>×</button>
        </div>
      )}
      
      {isLoading ? (
        <div className="loading-message">
          <div className="spinner"></div>
          <span>Loading reviews...</span>
        </div>
      ) : error ? (
        <div className="error-message">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      ) : (
        <>
          {!showReviewDetails ? (
            <>
              <div className="filter-controls">
                <div className="search-box">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Search in reviews..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </div>
                
                <div className="filters">
                  <div className="filter-item">
                    <Filter size={18} />
                    <select value={filterStatus} onChange={handleStatusFilterChange}>
                      <option value="">All Statuses</option>
                      <option value="APPROVED">Approved</option>
                      <option value="PENDING">Pending</option>
                      <option value="FLAGGED">Flagged</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>
                  
                  <div className="filter-item">
                    <Star size={18} />
                    <select value={filterRating} onChange={handleRatingFilterChange}>
                      <option value="">All Ratings</option>
                      <option value="5">5 Stars</option>
                      <option value="4">4 Stars</option>
                      <option value="3">3 Stars</option>
                      <option value="2">2 Stars</option>
                      <option value="1">1 Star</option>
                    </select>
                  </div>
                  
                  <div className="filter-item movie-filter">
                    <Film size={18} />
                    <div className="movie-search-container">
                      <input
                        type="text"
                        placeholder="Search for a movie..."
                        value={movieSearchTerm}
                        onChange={handleMovieSearchChange}
                        onFocus={() => setShowMovieDropdown(true)}
                        onBlur={() => setTimeout(() => setShowMovieDropdown(false), 200)}
                      />
                      {filterMovie && (
                        <button 
                          className="clear-filter-button"
                          onClick={clearMovieFilter}
                        >
                          &times;
                        </button>
                      )}
                      
                      {showMovieDropdown && filteredMovies.length > 0 && (
                        <div className="movie-dropdown">
                          {filteredMovies.map(movie => (
                            <div 
                              key={movie.id} 
                              className="movie-option"
                              onClick={() => handleMovieSelect(movie.id)}
                            >
                              {movie.posterUrl && (
                                <img 
                                  src={movie.posterUrl} 
                                  alt={movie.title} 
                                  className="movie-thumbnail" 
                                />
                              )}
                              <span>{movie.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="review-stats">
                <div className="stat-item">
                  <h4>Total Flagged</h4>
                  <p>{Array.isArray(reviews) ? reviews.filter(review => review.status === 'FLAGGED').length : 0}</p>
                </div>
                <div className="stat-item">
                  <h4>Total Pending</h4>
                  <p>{Array.isArray(reviews) ? reviews.filter(review => review.status === 'PENDING').length : 0}</p>
                </div>
                <div className="stat-item">
                  <h4>Total Approved</h4>
                  <p>{Array.isArray(reviews) ? reviews.filter(review => review.status === 'APPROVED').length : 0}</p>
                </div>
                <div className="stat-item">
                  <h4>Total Rejected</h4>
                  <p>{Array.isArray(reviews) ? reviews.filter(review => review.status === 'REJECTED').length : 0}</p>
                </div>
              </div>
              
              <div className="reviews-table-container">
                {currentPageReviews.length === 0 ? (
                  <div className="no-reviews-message">
                    <Info size={24} />
                    <p>No reviews found matching your filters.</p>
                  </div>
                ) : (
                  <table className="reviews-table">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Date</th>
                        <th>User</th>
                        <th>Rating</th>
                        <th>Content</th>
                        <th>Movie</th>
                        <th>Reports</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentPageReviews.map(review => (
                        <tr key={review.id} className={`status-${review.status.toLowerCase()}`}>
                          <td data-label="Status">
                            <span className={`status-badge ${review.status.toLowerCase()}`}>
                              {review.status}
                            </span>
                          </td>
                          <td data-label="Date">
                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            }) : 'Unknown Date'}
                          </td>
                          <td data-label="User">{review.userDisplayName || 'Unknown User'}</td>
                          <td data-label="Rating">{renderStarRating(review.rating)}</td>
                          <td data-label="Content" className="review-content-cell">
                            {review.content && review.content.length > 100
                              ? `${review.content.substring(0, 100)}...`
                              : review.content || 'No content'}
                          </td>
                          <td data-label="Movie" className="movie-cell">
                            {review.movieId && movieDetailsMap[review.movieId] ? (
                              <div className="movie-info-preview">
                                {movieDetailsMap[review.movieId].posterUrl && (
                                  <img 
                                    src={movieDetailsMap[review.movieId].posterUrl} 
                                    alt={movieDetailsMap[review.movieId].title || 'Movie poster'}
                                    className="movie-thumbnail" 
                                  />
                                )}
                                <span>{getMovieTitle(review.movieId)}</span>
                              </div>
                            ) : (
                              <span>Unknown Movie</span>
                            )}
                          </td>
                          <td data-label="Reports">
                            {review.reportCount ? (
                              <span className="report-count">{review.reportCount}</span>
                            ) : (
                              '0'
                            )}
                          </td>
                          <td data-label="Actions">
                            <button
                              className="view-button"
                              onClick={() => handleViewReview(review)}
                            >
                              <Eye size={18} />
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                
                {filteredReviews.length > itemsPerPage && (
                  <div className="pagination">
                    <button
                      className="pagination-button"
                      onClick={goToPrevPage}
                      disabled={page === 1}
                    >
                      <ArrowLeft size={16} />
                      Previous
                    </button>
                    <span className="page-info">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      className="pagination-button"
                      onClick={goToNextPage}
                      disabled={page === totalPages}
                    >
                      Next
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="review-details-container">
              <button
                className="back-button"
                onClick={handleCloseReviewDetails}
              >
                <ArrowLeft size={16} />
                Back to List
              </button>
              
              {currentReview && (
                <div className="review-details">
                  <h2>Review Details</h2>
                  
                  {currentReview.movieId && movieDetailsMap[currentReview.movieId] && (
                    <div className="movie-info-card">
                      <div className="movie-poster">
                        {movieDetailsMap[currentReview.movieId].posterUrl ? (
                          <img 
                            src={movieDetailsMap[currentReview.movieId].posterUrl} 
                            alt={movieDetailsMap[currentReview.movieId].title || 'Movie poster'} 
                          />
                        ) : (
                          <div className="poster-placeholder">No poster available</div>
                        )}
                      </div>
                      <div className="movie-details">
                        <h3>{movieDetailsMap[currentReview.movieId].title || 'Unknown Movie'}</h3>
                        {movieDetailsMap[currentReview.movieId]?.rating && (
                          <div className="movie-rating">
                            <Star fill="#FFC107" stroke="#FFC107" size={18} />
                            <span>{movieDetailsMap[currentReview.movieId].rating.average}/10</span>
                            <span className="vote-count">
                              ({movieDetailsMap[currentReview.movieId].rating.count} votes)
                            </span>
                          </div>
                        )}
                        {movieDetailsMap[currentReview.movieId]?.releaseDate && (
                          <div className="movie-release-date">
                            Released: {new Date(movieDetailsMap[currentReview.movieId].releaseDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="review-info">
                    <div className="review-info-item">
                      <h3>Status</h3>
                      <span className={`status-badge ${currentReview.status.toLowerCase()}`}>
                        {currentReview.status}
                      </span>
                    </div>
                    
                    <div className="review-info-item">
                      <h3>User</h3>
                      <p>{currentReview.userDisplayName || 'Unknown User'}</p>
                    </div>
                    
                    <div className="review-info-item">
                      <h3>Rating</h3>
                      {renderStarRating(currentReview.rating)}
                    </div>
                    
                    <div className="review-info-item">
                      <h3>Date</h3>
                      <p>
                        {currentReview.createdAt ? new Date(currentReview.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Unknown Date'}
                      </p>
                    </div>
                    
                    <div className="review-info-item">
                      <h3>Movie</h3>
                      <p>{getMovieTitle(currentReview.movieId)}</p>
                    </div>
                    
                    {currentReview.moderatedBy && (
                      <div className="review-info-item">
                        <h3>Moderated By</h3>
                        <p>{getUserDisplayName(currentReview.moderatedBy, currentReview.moderatedBy)}</p>
                      </div>
                    )}
                    
                    {currentReview.moderationNotes && (
                      <div className="review-info-item">
                        <h3>Moderation Notes</h3>
                        <p>{currentReview.moderationNotes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="review-content-full">
                    <h3>Review Content</h3>
                    <div className="content-box">
                      {currentReview.content || 'No content provided'}
                    </div>
                  </div>
                  
                  {currentReview.reports && currentReview.reports.length > 0 && (
  <div className="review-reports">
    <h3>Reports ({currentReview.reports.length})</h3>
    
    <div className="reports-list">
      {currentReview.reports.map((report, index) => (
        <div className="report-item" key={index}>
          <div 
            className="report-header" 
            onClick={() => toggleReportDetails(index)}
          >
            <div className="report-reason">
              <span className="report-label">Reason:</span>
              <span className="report-reason-value">
                {report.reason && typeof report.reason === 'string' ? 
                  report.reason.replace(/_/g, ' ').charAt(0) + 
                  report.reason.replace(/_/g, ' ').slice(1).toLowerCase() : 
                  'Unknown Reason'}
              </span>
            </div>
            
            <div className="report-meta">
              <span className="report-date">
                {report.reportedAt ? new Date(report.reportedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }) : 'Unknown Date'}
              </span>
              <ChevronDown 
                size={16} 
                className={currentReportExpanded === index ? 'chevron-rotated' : ''}
              />
            </div>
          </div>
          
          {currentReportExpanded === index && (
            <div className="report-details">
              <div className="report-detail-item">
                <span className="report-label">Reported By:</span>
                {/* THIS IS THE PART YOU NEED TO MODIFY */}
                <span>{getUserDisplayName(report.userId)}</span>
              </div>
              
              {report.additionalDetails && (
                <div className="report-detail-item">
                  <span className="report-label">Details:</span>
                  <span>{report.additionalDetails}</span>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
)}
                  
                  <div className="moderation-form">
                    <h3>Moderation</h3>
                    
                    <div className="form-group">
                      <label htmlFor="moderation-notes">Moderation Notes</label>
                      <textarea
                        id="moderation-notes"
                        placeholder="Add notes about your moderation decision..."
                        value={moderationNote}
                        onChange={(e) => setModerationNote(e.target.value)}
                        rows={4}
                      ></textarea>
                    </div>
                    
                    <div className="moderation-actions">
                      <button
                        className="approve-button"
                        onClick={() => handleModerateReview('approve')}
                        disabled={!currentReview.id}
                      >
                        <CheckCircle size={16} />
                        Approve Review
                      </button>
                      
                      <button
                        className="reject-button"
                        onClick={() => handleModerateReview('reject')}
                        disabled={!currentReview.id}
                      >
                        <XCircle size={16} />
                        Reject Review
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reviews;