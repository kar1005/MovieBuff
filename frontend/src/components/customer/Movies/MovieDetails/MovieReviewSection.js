import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  Flag, 
  Edit, 
  Trash2,
  AlertCircle,
  Check
} from 'lucide-react';
import { 
  getMovieReviews, 
  createReview, 
  updateReview, 
  deleteReview,
  markHelpful,
  markUnhelpful,
  reportReview,
  getReviewStats
} from '../../../../redux/slices/reviewSlice';
import './MovieReviewSection.css';
import { getMovieById } from '../../../../redux/slices/movieSlice';

const MovieReviewSection = ({ movieId }) => {
  const dispatch = useDispatch();
  
  // Get review data and user info from Redux store
  const { movieReviews, isLoading, error, success, message } = useSelector((state) => state.reviews);
  const { user, isAuthenticated, id: userId, email } = useSelector((state) => state.auth);
  
  // Local state for reviews
  const [userReview, setUserReview] = useState({
    rating: 0,
    content: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editReviewId, setEditReviewId] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReviewId, setReportReviewId] = useState(null);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // Find if the current user has already submitted a review
  const existingUserReview = movieReviews?.find(review => review.userId === userId);

  // Get displayable user name (use email if username is not available)
  const getUserDisplayName = () => {
    // Split email at @ and take first part
    if (email) {
      return email.split('@')[0];
    }
    return 'User';
  };

  // Fetch reviews when the component mounts or when movieId changes
  useEffect(() => {
    dispatch(getMovieReviews({ movieId, status: 'APPROVED' }));
    dispatch(getReviewStats(movieId));
  }, [dispatch, movieId]);

  // Set the form with existing review data when user has a review
  useEffect(() => {
    if (existingUserReview && !isEditing) {
      setUserReview({
        rating: existingUserReview.rating,
        content: existingUserReview.content
      });
    }
  }, [existingUserReview, isEditing]);

  // Show notification when success or error occurs
  useEffect(() => {
    if (success) {
      setNotification({
        show: true,
        message: message || 'Review submitted successfully!',
        type: 'success'
      });
      
      // Refresh reviews after successful operation
      dispatch(getMovieReviews({ movieId, status: 'APPROVED' }));
      
      // Auto-hide notification after 5 seconds
      const timer = setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 5000);
      
      return () => clearTimeout(timer);
    }
    
    if (error) {
      setNotification({
        show: true,
        message: error || 'An error occurred',
        type: 'error'
      });
      
      // Auto-hide notification after 5 seconds
      const timer = setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [success, error, message, dispatch, movieId]);

  // Rating change handler
  const handleRatingChange = (rating) => {
    setUserReview({ ...userReview, rating });
  };

  // Review content change handler
  const handleReviewContentChange = (e) => {
    setUserReview({ ...userReview, content: e.target.value });
  };

  // Submit review handler
  const handleSubmitReview = (e) => {
    e.preventDefault();
    
    if (userReview.rating === 0) {
      setNotification({
        show: true,
        message: 'Please select a rating before submitting',
        type: 'error'
      });
      return;
    }
  
    if (isEditing && editReviewId) {
      dispatch(updateReview({
        id: editReviewId,
        reviewData: {
          ...existingUserReview,
          rating: userReview.rating,
          content: userReview.content,
          status: 'APPROVED' // Keep the status as APPROVED when editing
        }
      })).then(() => {
        setIsEditing(false);
        setEditReviewId(null);
        
        // Reset form after submission
        setUserReview({ rating: 0, content: '' });
        
        // Refresh movie data to get updated rating
        dispatch(getMovieById(movieId));
      });
    } else {
      dispatch(createReview({
        movieId,
        userId,
        userDisplayName: getUserDisplayName(),
        rating: userReview.rating,
        content: userReview.content,
        status: 'APPROVED' // By default, set status to APPROVED for new reviews
      })).then(() => {
        // Reset form after submission
        setUserReview({ rating: 0, content: '' });
        
        // Refresh movie data to get updated rating
        dispatch(getMovieById(movieId));
      });
    }
  };
  
  // Edit review handler
  const handleEditReview = (review) => {
    setUserReview({
      rating: review.rating,
      content: review.content
    });
    setIsEditing(true);
    setEditReviewId(review.id);
    
    // Scroll to review form
    document.querySelector('.write-review').scrollIntoView({ behavior: 'smooth' });
  };

  // Delete review handler
  const handleDeleteReview = (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      dispatch(deleteReview(reviewId)).then(() => {
        // Refresh reviews after deletion
        dispatch(getMovieReviews({ movieId, status: 'APPROVED' }));
        
        // Refresh movie data to get updated rating
        dispatch(getMovieById(movieId));
      });
    }
  };

  // Mark review as helpful
  const handleHelpfulVote = (reviewId) => {
    if (!isAuthenticated) {
      setNotification({
        show: true,
        message: 'Please login to vote on reviews',
        type: 'error'
      });
      return;
    }
    dispatch(markHelpful({ id: reviewId, userId })).then(() => {
      // Refresh reviews after voting
      dispatch(getMovieReviews({ movieId, status: 'APPROVED' }));
    });
  };

  // Mark review as unhelpful
  const handleUnhelpfulVote = (reviewId) => {
    if (!isAuthenticated) {
      setNotification({
        show: true,
        message: 'Please login to vote on reviews',
        type: 'error'
      });
      return;
    }
    dispatch(markUnhelpful({ id: reviewId, userId })).then(() => {
      // Refresh reviews after voting
      dispatch(getMovieReviews({ movieId, status: 'APPROVED' }));
    });
  };

  // Open report modal
  const openReportModal = (reviewId) => {
    if (!isAuthenticated) {
      setNotification({
        show: true,
        message: 'Please login to report reviews',
        type: 'error'
      });
      return;
    }
    setReportReviewId(reviewId);
    setShowReportModal(true);
  };

  // Report review handler
// Updated handleReportReview function for proper report submission
const handleReportReview = () => {
  if (!reportReason) {
    setNotification({
      show: true,
      message: 'Please select a reason for reporting',
      type: 'error'
    });
    return;
  }

  // Create report data formatted according to backend expectations
  const reportData = {
    userId: userId || 'anonymous', // Handle potential missing userId
    reportedAt: new Date().toISOString(),
    reason: reportReason, // Send the reason as expected by backend
    additionalDetails: ''
  };

  // Send only the report data
  dispatch(reportReview({
    id: reportReviewId,
    reportData: reportData
  })).then(() => {
    // Refresh approved reviews after reporting
    dispatch(getMovieReviews({ movieId, status: 'APPROVED' }));
    
    setNotification({
      show: true,
      message: 'Review has been reported and will be reviewed by a moderator',
      type: 'success'
    });
  }).catch(error => {
    setNotification({
      show: true,
      message: `Error reporting review: ${error.message || 'Unknown error'}`,
      type: 'error'
    });
  });

  // Reset and close modal
  setReportReason('');
  setReportReviewId(null);
  setShowReportModal(false);
};

  // Cancel edit handler
  const cancelEdit = () => {
    setIsEditing(false);
    setEditReviewId(null);
    setUserReview({ rating: 0, content: '' });
  };

  // Close notification handler
  const closeNotification = () => {
    setNotification({ show: false, message: '', type: '' });
  };

  // Calculate average rating
  const calculateAverageRating = () => {
    if (!movieReviews || movieReviews.length === 0) return 0;
    
    const sum = movieReviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / movieReviews.length).toFixed(1);
  };

  // Get rating distribution
  const getRatingDistribution = () => {
    if (!movieReviews || movieReviews.length === 0) return {};
    
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    movieReviews.forEach(review => {
      if (distribution[review.rating] !== undefined) {
        distribution[review.rating]++;
      }
    });
    
    return distribution;
  };

  // Render star rating (display only)
  const renderStarRating = (rating) => {
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

  // Render rating input (interactive)
  const renderRatingInput = () => {
    return (
      <div className="rating-input">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={24}
            className="rating-star"
            fill={star <= (hoveredRating || userReview.rating) ? '#FFC107' : 'none'}
            stroke={star <= (hoveredRating || userReview.rating) ? '#FFC107' : '#ccc'}
            onClick={() => handleRatingChange(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
          />
        ))}
      </div>
    );
  };

  const distribution = getRatingDistribution();
  const totalReviews = movieReviews?.length || 0;

  return (
    <section className="reviews-section" id="reviews">
      <h2>Reviews</h2>
      
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
      ) : error && !notification.show ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
          <div className="reviews-overview">
            <div className="average-rating">
              <div className="rating-value">{calculateAverageRating()}</div>
              {renderStarRating(calculateAverageRating())}
              <div className="total-reviews">{totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}</div>
            </div>
            
            <div className="rating-distribution">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="rating-bar">
                  <span className="rating-label">{rating}</span>
                  <div className="rating-progress">
                    <div 
                      className="rating-progress-bar" 
                      style={{ width: `${totalReviews ? (distribution[rating] / totalReviews) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="rating-count">{distribution[rating] || 0}</span>
                </div>
              ))}
            </div>
          </div>
          
          {isAuthenticated ? (
            <div className="write-review">
              <h3>{isEditing ? 'Edit your review' : (existingUserReview ? 'Your review' : 'Write a review')}</h3>
              
              {!isEditing && existingUserReview ? (
                <div className="user-existing-review">
                  <div className="review-header">
                    <div className="review-user-info">
                      <div className="user-name">{existingUserReview.userDisplayName}</div>
                      {renderStarRating(existingUserReview.rating)}
                      <div className="review-date">
                        Posted: {new Date(existingUserReview.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                    <div className="review-actions">
                      <button 
                        className="edit-button"
                        onClick={() => handleEditReview(existingUserReview)}
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteReview(existingUserReview.id)}
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="review-content">{existingUserReview.content}</div>
                  {(existingUserReview.status === 'PENDING' || existingUserReview.status === 'FLAGGED') && (
                    <div className="review-pending-badge">
                      <AlertCircle size={14} />
                      {existingUserReview.status === 'PENDING' 
                        ? 'Pending approval' 
                        : 'Under review by moderator'}
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="review-form">
                  <div className="form-group">
                    <label>Your rating</label>
                    {renderRatingInput()}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="review-content">Your review</label>
                    <textarea
                      id="review-content"
                      value={userReview.content}
                      onChange={handleReviewContentChange}
                      placeholder="Write your review here..."
                      rows={5}
                      required
                    ></textarea>
                    <div className="textarea-counter">
                      {userReview.content.length}/1000
                    </div>
                  </div>
                  
                  <div className="form-actions">
                    {isEditing && (
                      <button type="button" className="cancel-button" onClick={cancelEdit}>
                        Cancel
                      </button>
                    )}
                    <button type="submit" className="submit-button">
                      {isEditing ? 'Update Review' : 'Submit Review'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="login-prompt">
              <AlertCircle size={20} />
              <p>Please login to write a review</p>
            </div>
          )}
          
          <div className="reviews-list">
            <h3>User Reviews</h3>
            
            {movieReviews?.length > 0 ? (
              movieReviews.map((review) => (
                <div key={review.id} className="review-item">
                  <div className="review-header">
                    <div className="review-user-info">
                      <div className="user-name">{review.userDisplayName}</div>
                      {renderStarRating(review.rating)}
                      <div className="review-date">
                        {new Date(review.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="review-content">{review.content}</div>
                  
                  <div className="review-footer">
                    <div className="review-feedback">
                      <button
                        className={`helpful-button ${review.helpfulUserIds?.includes(userId) ? 'active' : ''}`}
                        onClick={() => handleHelpfulVote(review.id)}
                        aria-label="Mark as helpful"
                      >
                        <ThumbsUp size={16} />
                        <span className="feedback-label">Helpful</span>
                        <span className="feedback-count">({review.helpfulCount || 0})</span>
                      </button>
                      <button
                        className={`unhelpful-button ${review.unhelpfulUserIds?.includes(userId) ? 'active' : ''}`}
                        onClick={() => handleUnhelpfulVote(review.id)}
                        aria-label="Mark as not helpful"
                      >
                        <ThumbsDown size={16} />
                        <span className="feedback-label">Not helpful</span>
                        <span className="feedback-count">({review.unhelpfulCount || 0})</span>
                      </button>
                    </div>
                    
                    <button
                      className="report-button"
                      onClick={() => openReportModal(review.id)}
                      aria-label="Report review"
                    >
                      <Flag size={16} />
                      <span className="report-label">Report</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-reviews">
                <div className="no-reviews-icon">📝</div>
                <p>No reviews yet. Be the first to share your thoughts!</p>
              </div>
            )}
          </div>
        </>
      )}
      
      {/* Report Review Modal */}
      {showReportModal && (
        <div className="modal-backdrop" onClick={() => setShowReportModal(false)}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Report Review</h3>
            <p>Please select a reason for reporting this review:</p>
            
            <div className="report-reason-options">
              {['SPOILER', 'OFFENSIVE_CONTENT', 'SPAM', 'IRRELEVANT', 'MISLEADING', 'OTHER'].map((reason) => (
                <div key={reason} className="report-reason-option">
                  <input
                    type="radio"
                    id={reason}
                    name="reportReason"
                    value={reason}
                    checked={reportReason === reason}
                    onChange={() => setReportReason(reason)}
                  />
                  <label htmlFor={reason}>
                    {reason.replace(/_/g, ' ').charAt(0) + reason.replace(/_/g, ' ').slice(1).toLowerCase()}
                  </label>
                </div>
              ))}
            </div>
            
            <div className="modal-actions">
              <button className="cancel-button" onClick={() => setShowReportModal(false)}>
                Cancel
              </button>
              <button className="submit-button" onClick={handleReportReview}>
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default MovieReviewSection;