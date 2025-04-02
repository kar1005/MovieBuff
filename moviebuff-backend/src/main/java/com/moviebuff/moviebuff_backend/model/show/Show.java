// src/main/java/com/moviebuff/moviebuff_backend/model/show/Show.java
package com.moviebuff.moviebuff_backend.model.show;

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
import java.util.Map;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "shows")
public class Show {
    @Id
    private String id;
    
    @Indexed
    private String movieId;
    
    @Indexed
    private String theaterId;
    
    private Integer screenNumber;
    
    @Indexed
    private LocalDateTime showTime;
    
    private String language;
    private String experience;
    private Map<String, PricingTier> pricing;
    
    // Improved seat availability tracking
    private List<SeatStatus> seatStatus;
    
    // Quick access fields for performance
    private Integer totalSeats;
    private Integer availableSeats;
    private Integer bookedSeats;
    
    // Trending/popularity tracking
    private Integer viewCount;       // Number of times show details were viewed
    private Integer bookingAttempts; // Number of times users initiated booking flow
    private Double popularityScore;  // Calculated field based on various metrics
    
    @Indexed
    private ShowStatus status;
    
    // Audit fields
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Data
    @SuperBuilder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PricingTier {
        private String categoryName; // Maps to theater section category
        private Double basePrice;
        private List<AdditionalCharge> additionalCharges;
        private Double finalPrice;
    }

    @Data
    @SuperBuilder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdditionalCharge {
        private String type;  // CONVENIENCE_FEE, GST, SERVICE_CHARGE, etc.
        private Double amount;
        private Boolean isPercentage; // True if amount is a percentage
    }

    @Data
    @SuperBuilder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SeatStatus {
        private String seatId;       // Unique identifier for seat (e.g. "A1")
        private Integer row;
        private Integer column;
        private String category;     // Maps to theater section category
        private SeatAvailability status;
        private String bookingId;    // Reference to booking if seat is booked
        private LocalDateTime lastUpdated;
    }

    public enum SeatAvailability {
        AVAILABLE,
        BOOKED,
        BLOCKED,     // Temporarily blocked during checkout
        UNAVAILABLE  // Not for sale (damaged, restricted view, etc.)
    }

    public enum ShowStatus {
        OPEN,
        SOLDOUT,
        FILLINGFAST,  // When seats are getting filled quickly
        FEWSEATSLEFT, // When less than 10% seats are available
        STARTED,      // Show has started
        FINISHED,     // Show has finished
        CANCELLED
    }
    
    // Helper methods
    public void updateAvailabilityCounters() {
        if (seatStatus != null) {
            int available = 0;
            int booked = 0;
            
            for (SeatStatus seat : seatStatus) {
                if (seat.getStatus() == SeatAvailability.AVAILABLE) {
                    available++;
                } else if (seat.getStatus() == SeatAvailability.BOOKED) {
                    booked++;
                }
            }
            
            this.availableSeats = available;
            this.bookedSeats = booked;
            this.totalSeats = seatStatus.size();
        }
    }
    
    // Method to update show status based on seat availability
    public void updateShowStatus() {
        if (this.availableSeats == 0) {
            this.status = ShowStatus.SOLDOUT;
        } else if (this.availableSeats <= (this.totalSeats * 0.1)) { // Less than 10% seats left
            this.status = ShowStatus.FEWSEATSLEFT;
        } else {
            this.status = ShowStatus.OPEN;
        }
    }
    
    // Calculate popularity score based on various metrics
    public void calculatePopularityScore() {
        // Simple example algorithm - can be made more sophisticated
        this.popularityScore = (this.viewCount * 0.3) + 
                               (this.bookingAttempts * 0.3) + 
                               ((double)this.bookedSeats / this.totalSeats * 0.4) * 100;
    }
}