package com.moviebuff.moviebuff_backend.service.review;

import com.moviebuff.moviebuff_backend.exception.ResourceNotFoundException;
import com.moviebuff.moviebuff_backend.model.movie.Movie;
import com.moviebuff.moviebuff_backend.model.review.Review;
import com.moviebuff.moviebuff_backend.repository.interfaces.movie.MovieRepository;
import com.moviebuff.moviebuff_backend.repository.interfaces.review.IReviewRepository;
import lombok.RequiredArgsConstructor;
// import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
// import org.springframework.data.mongodb.core.MongoTemplate;
// import org.springframework.data.mongodb.core.aggregation.Aggregation;
// import org.springframework.data.mongodb.core.aggregation.AggregationResults;
// import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements IReviewService {

    private final IReviewRepository reviewRepository;
    private final MovieRepository movieRepository;
    // private final MongoTemplate mongoTemplate;

    @Override
    public List<Review> getAllReviews(String movieId, Review.ReviewStatus status) {
        if (movieId != null && status != null) {
            return reviewRepository.findByMovieIdAndStatus(movieId, status);
        } else if (movieId != null) {
            return reviewRepository.findByMovieId(movieId);
        } else if (status != null) {
            return reviewRepository.findByStatus(status);
        }
        return reviewRepository.findAll();
    }

    @Override
    @Cacheable(value = "reviews", key = "#id")
    public Review getReviewById(String id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + id));
    }

    @Override
    public List<Review> getUserReviews(String userId) {
        return reviewRepository.findByUserId(userId);
    }

    @Override
    public List<Review> getMovieReviews(String movieId, Review.ReviewStatus status) {
        if (status != null) {
            return reviewRepository.findByMovieIdAndStatus(movieId, status);
        }
        return reviewRepository.findByMovieId(movieId);
    }

    @Override
    @Transactional
    public Review createReview(Review review) {
        // Set initial values
        review.setCreatedAt(LocalDateTime.now());
        review.setUpdatedAt(LocalDateTime.now());
        review.setHelpfulCount(0);
        review.setUnhelpfulCount(0);
        review.setReportCount(0);
        
        // Set default status
        if (review.getStatus() == null) {
            review.setStatus(Review.ReviewStatus.PENDING);
        }
        
        // Save the review
        Review savedReview = reviewRepository.save(review);
        
        // Update movie rating if the review is approved
        if (review.getStatus() == Review.ReviewStatus.APPROVED) {
            updateMovieRating(review.getMovieId());
        }
        
        return savedReview;
    }

    @Override
    @Transactional
    @CacheEvict(value = "reviews", key = "#id")
    public Review updateReview(String id, Review review) {
        Review existingReview = getReviewById(id);
        
        // Update fields
        existingReview.setContent(review.getContent());
        existingReview.setRating(review.getRating());
        existingReview.setUpdatedAt(LocalDateTime.now());
        
        // Check if status changed from not approved to approved
        boolean statusChangedToApproved = existingReview.getStatus() != Review.ReviewStatus.APPROVED && 
                                          review.getStatus() == Review.ReviewStatus.APPROVED;
        
        // Update status if provided
        if (review.getStatus() != null) {
            existingReview.setStatus(review.getStatus());
        }
        
        Review updatedReview = reviewRepository.save(existingReview);
        
        // Update movie rating if review status changed to approved
        if (statusChangedToApproved) {
            updateMovieRating(existingReview.getMovieId());
        }
        
        return updatedReview;
    }

    @Override
    @Transactional
    @CacheEvict(value = "reviews", key = "#id")
    public void deleteReview(String id) {
        Review review = getReviewById(id);
        reviewRepository.deleteById(id);
        
        // Update movie rating if the review was approved
        if (review.getStatus() == Review.ReviewStatus.APPROVED) {
            updateMovieRating(review.getMovieId());
        }
    }

    @Override
    @Transactional
    @CacheEvict(value = "reviews", key = "#id")
    public Review moderateReview(String id, String moderatedBy, String moderationNotes, Review.ReviewStatus status) {
        Review review = getReviewById(id);
        
        // Check if status is changing to or from APPROVED
        boolean statusChanging = review.getStatus() != status && 
                (review.getStatus() == Review.ReviewStatus.APPROVED || status == Review.ReviewStatus.APPROVED);
        
        // Update moderation fields
        review.setModeratedBy(moderatedBy);
        review.setModerationNotes(moderationNotes);
        review.setStatus(status);
        review.setModeratedAt(LocalDateTime.now());
        review.setUpdatedAt(LocalDateTime.now());
        
        Review moderatedReview = reviewRepository.save(review);
        
        // Update movie rating if necessary
        if (statusChanging) {
            updateMovieRating(review.getMovieId());
        }
        
        return moderatedReview;
    }

    @Override
    @Transactional
    @CacheEvict(value = "reviews", key = "#id")
    public Review markHelpful(String id, String userId) {
        Review review = getReviewById(id);
        review.addHelpfulVote(userId);
        return reviewRepository.save(review);
    }

    @Override
    @Transactional
    @CacheEvict(value = "reviews", key = "#id")
    public Review markUnhelpful(String id, String userId) {
        Review review = getReviewById(id);
        review.addUnhelpfulVote(userId);
        return reviewRepository.save(review);
    }

    @Override
    @Transactional
    @CacheEvict(value = "reviews", key = "#id")
    public Review reportReview(String id, Review.ReportReason report) {
        Review review = getReviewById(id);
        review.addReport(report.getUserId(), report.getReason(), report.getAdditionalDetails());
        return reviewRepository.save(review);
    }

    @Override
    @Cacheable(value = "review-stats", key = "#movieId")
    public Map<String, Object> getReviewStats(String movieId) {
        Map<String, Object> stats = new HashMap<>();
        
        // Get all approved reviews for movie
        List<Review> reviews = reviewRepository.findByMovieIdAndStatus(movieId, Review.ReviewStatus.APPROVED);
        
        if (reviews.isEmpty()) {
            stats.put("totalReviews", 0);
            stats.put("averageRating", 0.0);
            stats.put("ratingDistribution", new HashMap<Integer, Long>());
            stats.put("hasReviews", false);
            return stats;
        }
        
        // Calculate total reviews
        stats.put("totalReviews", reviews.size());
        
        // Calculate average rating
        double averageRating = reviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);
        stats.put("averageRating", Math.round(averageRating * 10.0) / 10.0); // Round to 1 decimal place
        
        // Calculate rating distribution
        Map<Integer, Long> ratingDistribution = reviews.stream()
                .collect(Collectors.groupingBy(Review::getRating, Collectors.counting()));
        
        // Ensure all ratings 1-5 have entries
        for (int i = 1; i <= 5; i++) {
            if (!ratingDistribution.containsKey(i)) {
                ratingDistribution.put(i, 0L);
            }
        }
        stats.put("ratingDistribution", ratingDistribution);
        
        // Add flag indicating movie has reviews
        stats.put("hasReviews", true);
        
        // Add most helpful reviews
        List<Review> helpfulReviews = reviews.stream()
                .sorted(Comparator.comparing(Review::getHelpfulCount).reversed())
                .limit(3)
                .collect(Collectors.toList());
        stats.put("mostHelpfulReviews", helpfulReviews);
        
        return stats;
    }
    
    // Helper methods
    
    private void updateMovieRating(String movieId) {
        // Get all approved reviews for movie
        List<Review> approvedReviews = reviewRepository.findByMovieIdAndStatus(movieId, Review.ReviewStatus.APPROVED);
        
        // Calculate new average rating
        double averageRating = 0.0;
        if (!approvedReviews.isEmpty()) {
            averageRating = approvedReviews.stream()
                    .mapToInt(Review::getRating)
                    .average()
                    .orElse(0.0);
        }
        
        // Update movie rating
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found with id: " + movieId));
        
        Movie.MovieRating rating = Movie.MovieRating.builder()
                .average(Math.round(averageRating * 10.0) / 10.0) // Round to 1 decimal place
                .count(approvedReviews.size())
                .build();
        
        movie.setRating(rating);
        movieRepository.save(movie);
    }
}