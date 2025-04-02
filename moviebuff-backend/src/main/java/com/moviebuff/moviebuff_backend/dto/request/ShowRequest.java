package com.moviebuff.moviebuff_backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShowRequest {
    
    @NotBlank(message = "Movie ID is required")
    private String movieId;
    
    @NotBlank(message = "Theater ID is required")
    private String theaterId;
    
    @NotNull(message = "Screen number is required")
    private Integer screenNumber;
    
    @NotNull(message = "Show time is required")
    @Future(message = "Show time must be in the future")
    private LocalDateTime showTime;
    
    @NotBlank(message = "Language is required")
    private String language;
    
    @NotBlank(message = "Experience type is required")
    private String experience;
    
    @NotNull(message = "Movie duration is required")
    @Min(value = 1, message = "Duration must be at least 1 minute")
    private Integer duration;
    
    @NotNull(message = "Pricing information is required")
    private Map<String, PricingRequest> pricing;
    
    @NotNull(message = "Seat layout information is required")
    private Map<String, Integer> seatLayout; // Category to count mapping

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PricingRequest {
        
        @NotNull(message = "Base price is required")
        @Min(value = 0, message = "Base price cannot be negative")
        private Double basePrice;
        
        private List<AdditionalChargeRequest> additionalCharges;
        
        @NotNull(message = "Final price is required")
        @Min(value = 0, message = "Final price cannot be negative")
        private Double finalPrice;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdditionalChargeRequest {
        
        @NotBlank(message = "Charge type is required")
        private String type;
        
        @NotNull(message = "Charge amount is required")
        private Double amount;
        
        private Boolean isPercentage = false;
    }
}