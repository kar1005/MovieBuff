// ScreenRequest.java
package com.moviebuff.moviebuff_backend.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.List;

@Data
public class ScreenRequest {
    @NotNull
    private Integer screenNumber;
    
    @NotBlank
    private String screenName;

    private List<String> supportedExperiences;
    
    @NotNull
    private SeatLayoutRequest layout;
    
    private ScreenFeatures features;

    // This will be calculated based on layout
    private Integer totalSeats;

    @Data
    public static class ScreenFeatures {
        private Double screenWidth;
        private Double screenHeight;
        private String projectorType;
        private String soundSystem;
    }
}