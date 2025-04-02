package com.moviebuff.moviebuff_backend.controller.Review;

import com.moviebuff.moviebuff_backend.model.review.Review;
import com.moviebuff.moviebuff_backend.service.review.IReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {
    
    @Autowired
    private IReviewService reviewService;
    
    @GetMapping
    public ResponseEntity<List<Review>> getAllReviews(
            @RequestParam(required = false) String movieId,
            @RequestParam(required = false) Review.ReviewStatus status) {
        return ResponseEntity.ok(reviewService.getAllReviews(movieId, status));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Review> getReviewById(@PathVariable String id) {
        return ResponseEntity.ok(reviewService.getReviewById(id));
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Review>> getUserReviews(@PathVariable String userId) {
        return ResponseEntity.ok(reviewService.getUserReviews(userId));
    }
    
    @GetMapping("/movie/{movieId}")
    public ResponseEntity<List<Review>> getMovieReviews(
            @PathVariable String movieId,
            @RequestParam(required = false) Review.ReviewStatus status) {
        return ResponseEntity.ok(reviewService.getMovieReviews(movieId, status));
    }
    
    @PostMapping
    public ResponseEntity<Review> createReview(@RequestBody Review review) {
        return ResponseEntity.ok(reviewService.createReview(review));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Review> updateReview(
            @PathVariable String id,
            @RequestBody Review review) {
        return ResponseEntity.ok(reviewService.updateReview(id, review));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable String id) {
        reviewService.deleteReview(id);
        return ResponseEntity.noContent().build();
    }
    
    @PatchMapping("/{id}/moderate")
    public ResponseEntity<Review> moderateReview(
            @PathVariable String id,
            @RequestBody Map<String, Object> moderationData) {
        String moderatedBy = (String) moderationData.get("moderatedBy");
        String moderationNotes = (String) moderationData.get("moderationNotes");
        Review.ReviewStatus status = Review.ReviewStatus.valueOf((String) moderationData.get("status"));
        
        return ResponseEntity.ok(reviewService.moderateReview(id, moderatedBy, moderationNotes, status));
    }
    
    @PostMapping("/{id}/helpful")
    public ResponseEntity<Review> markHelpful(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String userId = body.get("userId");
        return ResponseEntity.ok(reviewService.markHelpful(id, userId));
    }
    
    @PostMapping("/{id}/unhelpful")
    public ResponseEntity<Review> markUnhelpful(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String userId = body.get("userId");
        return ResponseEntity.ok(reviewService.markUnhelpful(id, userId));
    }
    
    @PostMapping("/{id}/report")
    public ResponseEntity<Review> reportReview(
            @PathVariable String id,
            @RequestBody Review.ReportReason report) {
        return ResponseEntity.ok(reviewService.reportReview(id, report));
    }
    
    @GetMapping("/stats/{movieId}")
    public ResponseEntity<Map<String, Object>> getReviewStats(@PathVariable String movieId) {
        return ResponseEntity.ok(reviewService.getReviewStats(movieId));
    }
}