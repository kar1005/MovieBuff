// src/main/java/com/moviebuff/moviebuff_backend/dto/request/ShowRequest.java
package com.moviebuff.moviebuff_backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShowRequest {
    @NotNull(message = "Movie ID is required")
    private String movieId;

    @NotNull(message = "Theater ID is required")
    private String theaterId;

    @NotNull(message = "Screen number is required")
    @Min(value = 1, message = "Screen number must be at least 1")
    private Integer screenNumber;

    @NotNull(message = "Show time is required")
    @Future(message = "Show time must be in the future")
    private LocalDateTime showTime;

    @NotNull(message = "Language is required")
    private String language;

    @NotNull(message = "Experience type is required")
    private String experience;

    @NotNull(message = "Duration is required")
    @Min(value = 30, message = "Duration must be at least 30 minutes")
    private Integer duration;

    @NotNull(message = "Pricing information is required")
    private Map<String, PricingInfo> pricing;

    @NotNull(message = "Seat layout is required")
    private Map<String, Integer> seatLayout;

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
}