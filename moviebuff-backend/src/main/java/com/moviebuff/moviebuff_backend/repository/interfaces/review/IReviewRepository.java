package com.moviebuff.moviebuff_backend.repository.interfaces.review;

import com.moviebuff.moviebuff_backend.model.review.Review;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IReviewRepository extends MongoRepository<Review, String> {

    List<Review> findByMovieId(String movieId);
    
    List<Review> findByUserId(String userId);
    
    List<Review> findByStatus(Review.ReviewStatus status);
    
    List<Review> findByMovieIdAndStatus(String movieId, Review.ReviewStatus status);
    
    List<Review> findByUserIdAndStatus(String userId, Review.ReviewStatus status);
    
    List<Review> findByMovieIdAndUserIdAndStatus(String movieId, String userId, Review.ReviewStatus status);
    
    boolean existsByMovieIdAndUserIdAndStatus(String movieId, String userId, Review.ReviewStatus status);
    
    Long countByMovieIdAndStatus(String movieId, Review.ReviewStatus status);
    
    Long countByUserIdAndStatus(String userId, Review.ReviewStatus status);
}