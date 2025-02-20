// ScreenDTO.java
package com.moviebuff.moviebuff_backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class ScreenDTO {
    @NotNull
    private Integer screenNumber;
    
    @NotBlank
    private String screenName;
    
    private List<String> supportedExperiences;
    
    private SeatLayoutDTO layout;  // Changed from Map to SeatLayoutRequest
    
    private ScreenFeatures features;    // Changed to proper type
    
    private Integer totalSeats;

    private Boolean isActive;
    private Integer availableSeats;


    @Data
    public static class ScreenFeatures {
        private Double screenWidth;
        private Double screenHeight;
        private String projectorType;
        private String soundSystem;
    }
}

