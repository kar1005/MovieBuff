package com.moviebuff.moviebuff_backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShowResponse {
    private String id;
    private String movieId;
    private String theaterId;
    private Integer screenNumber;
    private LocalDateTime showTime;
    private LocalDateTime endTime;
    private String language;
    private String experience;
    private String status;
    private Integer totalSeats;
    private Integer availableSeats;
    private Integer bookedSeats;
    private Double popularityScore;
    
    // Show duration components (in minutes)
    private Integer movieDuration;
    private Integer intervalTime;
    private Integer cleanupTime;
    
    // Related entities
    private MovieInfo movie;
    private TheaterInfo theater;
    private ScreenInfo screen;
    
    // Pricing
    private Map<String, PricingInfo> pricing;
    
    // Seat information
    private List<SeatInfo> seats;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PricingInfo {
        private Double basePrice;
        private List<AdditionalCharge> additionalCharges;
        private Double finalPrice;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdditionalCharge {
        private String type;
        private Double amount;
        private Boolean isPercentage;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SeatInfo {
        private String seatId;
        private Integer row;
        private Integer column;
        private String category;
        private String status;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MovieInfo {
        private String title;
        private String posterUrl;
        private Integer duration;
        private String grade;
        private Double rating;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TheaterInfo {
        private String name;
        private String address;
        private String city;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScreenInfo {
        private String name;
        private List<String> supportedExperiences;
    }
}