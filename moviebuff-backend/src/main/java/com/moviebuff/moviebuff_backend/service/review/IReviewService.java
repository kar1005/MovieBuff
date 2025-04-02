package com.moviebuff.moviebuff_backend.service.review;

import com.moviebuff.moviebuff_backend.model.review.Review;
import java.util.List;
import java.util.Map;

public interface IReviewService {
    
    // CRUD operations
    List<Review> getAllReviews(String movieId, Review.ReviewStatus status);
    Review getReviewById(String id);
    List<Review> getUserReviews(String userId);
    List<Review> getMovieReviews(String movieId, Review.ReviewStatus status);
    Review createReview(Review review);
    Review updateReview(String id, Review review);
    void deleteReview(String id);
    
    // Additional operations
    Review moderateReview(String id, String moderatedBy, String moderationNotes, Review.ReviewStatus status);
    Review markHelpful(String id, String userId);
    Review markUnhelpful(String id, String userId);
    Review reportReview(String id, Review.ReportReason report);
    Map<String, Object> getReviewStats(String movieId);
}