// src/main/java/com/moviebuff/model/review/Review.java
package com.moviebuff.moviebuff_backend.model.review;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "reviews")
public class Review {
    @Id
    private String id;
    
    @Indexed
    private String movieId;
    
    @Indexed
    private String userId;
    
    private String userDisplayName; // User's display name (for caching)
    
    @Indexed
    private Integer rating;
    
    private String content;
    
    // Added fields for tracking likes/helpfulness
    private Integer helpfulCount;
    private Integer unhelpfulCount;
    private List<String> helpfulUserIds; // Users who marked as helpful
    private List<String> unhelpfulUserIds; // Users who marked as unhelpful
    
    // Added fields for inappropriate content reporting
    private Integer reportCount;
    private List<ReportReason> reports;
    
    @Indexed
    private ReviewStatus status;
    
    // Moderation fields
    private String moderatedBy;
    private String moderationNotes;
    private LocalDateTime moderatedAt;
    
    // Timestamps for creation and updates
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    // Verified Purchase
    private Boolean isVerifiedPurchase;
    private String bookingId; // If the review is based on a booking

    // Review status enum
    public enum ReviewStatus {
        APPROVED,
        PENDING,
        REJECTED,
        FLAGGED // When review has been flagged for moderation but not yet rejected
    }
    
    // Report reason class
    @Data
    @SuperBuilder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReportReason {
        private String userId;
        private LocalDateTime reportedAt;
        private ReportType reason;
        private String additionalDetails;
    }
    
    // Enum for report types
    public enum ReportType {
        SPOILER,
        OFFENSIVE_CONTENT,
        SPAM,
        IRRELEVANT,
        MISLEADING,
        OTHER
    }
    
    // Helper methods
    public void addHelpfulVote(String userId) {
        if (helpfulUserIds == null) {
            helpfulUserIds = List.of(userId);
        } else if (!helpfulUserIds.contains(userId)) {
            helpfulUserIds.add(userId);
        }
        
        // If user previously marked as unhelpful, remove from unhelpful list
        if (unhelpfulUserIds != null && unhelpfulUserIds.contains(userId)) {
            unhelpfulUserIds.remove(userId);
        }
        
        // Update counts
        this.helpfulCount = helpfulUserIds.size();
        this.unhelpfulCount = unhelpfulUserIds != null ? unhelpfulUserIds.size() : 0;
    }
    
    public void addUnhelpfulVote(String userId) {
        if (unhelpfulUserIds == null) {
            unhelpfulUserIds = List.of(userId);
        } else if (!unhelpfulUserIds.contains(userId)) {
            unhelpfulUserIds.add(userId);
        }
        
        // If user previously marked as helpful, remove from helpful list
        if (helpfulUserIds != null && helpfulUserIds.contains(userId)) {
            helpfulUserIds.remove(userId);
        }
        
        // Update counts
        this.helpfulCount = helpfulUserIds != null ? helpfulUserIds.size() : 0;
        this.unhelpfulCount = unhelpfulUserIds.size();
    }
    
    public void addReport(String userId, ReportType reason, String details) {
        ReportReason report = new ReportReason(userId, LocalDateTime.now(), reason, details);
        
        if (reports == null) {
            reports = List.of(report);
        } else {
            reports.add(report);
        }
        
        this.reportCount = reports.size();
        
        // Automatically flag for moderation if report count exceeds threshold
        if (this.reportCount >= 3 && this.status == ReviewStatus.APPROVED) {
            this.status = ReviewStatus.FLAGGED;
        }
    }
}