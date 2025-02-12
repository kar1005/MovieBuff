// src/main/java/com/moviebuff/moviebuff_backend/dto/response/ShowResponse.java
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
    private String language;
    private String experience;
    private Map<String, PricingInfo> pricing;
    private Map<String, Boolean[]> seatAvailability;
    private String status;
    private MovieInfo movie;
    private TheaterInfo theater;
    private ScreenInfo screen;

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
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MovieInfo {
        private String title;
        private String posterUrl;
        private Integer duration;
        private String grade;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TheaterInfo {
        private String name;
        private String location;
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