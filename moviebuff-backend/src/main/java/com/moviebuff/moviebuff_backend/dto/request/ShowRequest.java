package com.moviebuff.moviebuff_backend.dto.request;

import com.moviebuff.moviebuff_backend.model.show.Show;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;

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
    private LocalDateTime showTime;
    
    // Optional fields for calculating end time
    private Integer cleanupTime;
    private Integer intervalTime;
    
    @NotBlank(message = "Language is required")
    private String language;
    
    @NotBlank(message = "Experience (e.g., 2D, 3D) is required")
    private String experience;
    
    // Movie duration (in minutes) - can be fetched from movie service
    private Integer duration;
    
    @Valid
    @NotNull(message = "Pricing information is required")
    private Map<String, PricingInfo> pricing;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PricingInfo {
        @NotNull(message = "Base price is required")
        @Positive(message = "Base price must be positive")
        private Double basePrice;
        
        private List<AdditionalChargeInfo> additionalCharges;
        
        @NotNull(message = "Final price is required")
        @Positive(message = "Final price must be positive")
        private Double finalPrice;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdditionalChargeInfo {
        @NotBlank(message = "Charge type is required")
        private String type;
        
        @NotNull(message = "Amount is required")
        @Positive(message = "Amount must be positive")
        private Double amount;
        
        @NotNull(message = "IsPercentage flag is required")
        private Boolean isPercentage;
    }
}