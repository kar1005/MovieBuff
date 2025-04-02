// src/main/java/com/moviebuff/model/coupon/Coupon.java
package com.moviebuff.moviebuff_backend.model.coupon;

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
@Document(collection = "coupons")
public class Coupon {
    @Id
    private String id;
    
    @Indexed(unique = true)
    private String code;
    
    private String name;
    private String description;
    
    private CouponType type;
    private Double value;
    private Double minBookingAmount;
    private Double maxDiscount;
    
    // Time validity
    @Indexed
    private LocalDateTime validFrom;
    
    @Indexed
    private LocalDateTime validUntil;
    
    // Usage limits
    private Integer usageLimit;      // Total usage limit
    private Integer usagePerUser;    // Usage limit per user
    private Integer usageCount;      // Current usage count
    
    // Target-specific fields
    private List<String> targetMovieIds;        // Specific movies this coupon applies to
    private List<String> targetTheaterIds;      // Specific theaters this coupon applies to
    private List<String> targetExperiences;     // Specific experiences (2D, 3D, etc.)
    private List<String> targetCities;          // Cities where this coupon is valid
    
    // User targeting
    private UserTargetType userTargetType;
    private LocalDateTime userRegisteredAfter;  // For new users
    private LocalDateTime userRegisteredBefore; // For existing users
    private List<String> targetUserIds;         // For specific users
    
    // Status and validation
    @Indexed
    private CouponStatus status;
    private String rejectionReason;  // If coupon is rejected or deactivated
    
    // Campaign tracking
    private String campaignId;
    private String createdBy;
    
    // Audit fields
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;

    public enum CouponType {
        PERCENTAGE,
        FIXED
    }

    public enum CouponStatus {
        ACTIVE,      // Coupon is active and can be used
        EXPIRED,     // Coupon has expired
        DEPLETED,    // Usage limit reached
        SCHEDULED,   // Scheduled for future activation
        PAUSED,      // Temporarily paused
        CANCELLED,   // Cancelled before expiry
        REJECTED     // Rejected during approval process
    }
    
    public enum UserTargetType {
        ALL_USERS,
        NEW_USERS,    // Registered after a certain date
        EXISTING_USERS, // Registered before a certain date
        SPECIFIC_USERS, // Specific user IDs
        FIRST_TIME_BOOKING // Users making their first booking
    }
    
    // Helper methods
    public boolean isValid() {
        LocalDateTime now = LocalDateTime.now();
        return status == CouponStatus.ACTIVE && 
               now.isAfter(validFrom) && 
               now.isBefore(validUntil) && 
               (usageLimit == null || usageCount < usageLimit);
    }
    
    public boolean isApplicableToMovie(String movieId) {
        return targetMovieIds == null || targetMovieIds.isEmpty() || targetMovieIds.contains(movieId);
    }
    
    public boolean isApplicableToTheater(String theaterId) {
        return targetTheaterIds == null || targetTheaterIds.isEmpty() || targetTheaterIds.contains(theaterId);
    }
    
    public boolean isApplicableToExperience(String experience) {
        return targetExperiences == null || targetExperiences.isEmpty() || targetExperiences.contains(experience);
    }
    
    public boolean isApplicableToCity(String city) {
        return targetCities == null || targetCities.isEmpty() || targetCities.contains(city);
    }
    
    public boolean isApplicableToUser(String userId, LocalDateTime userRegistrationDate, boolean isFirstBooking) {
        // Check if coupon is applicable based on user targeting
        switch (userTargetType) {
            case ALL_USERS:
                return true;
            case NEW_USERS:
                return userRegisteredAfter != null && userRegistrationDate.isAfter(userRegisteredAfter);
            case EXISTING_USERS:
                return userRegisteredBefore != null && userRegistrationDate.isBefore(userRegisteredBefore);
            case SPECIFIC_USERS:
                return targetUserIds != null && targetUserIds.contains(userId);
            case FIRST_TIME_BOOKING:
                return isFirstBooking;
            default:
                return true;
        }
    }
    
    public Double calculateDiscount(Double amount) {
        Double discount;
        
        if (type == CouponType.PERCENTAGE) {
            discount = amount * (value / 100.0);
        } else {
            discount = value;
        }
        
        // Apply maximum discount cap if specified
        if (maxDiscount != null && discount > maxDiscount) {
            discount = maxDiscount;
        }
        
        return discount;
    }
}