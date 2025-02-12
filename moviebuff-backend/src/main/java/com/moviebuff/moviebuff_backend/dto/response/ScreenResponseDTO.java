// ScreenResponseDTO.java
package com.moviebuff.moviebuff_backend.dto.response;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScreenResponseDTO {
    private Integer screenNumber;
    private String screenName;
    private List<String> supportedExperiences;
    private ScreenLayoutResponseDTO layout;
    private ScreenFeaturesResponse features;
    private Boolean isActive;
    private Integer totalSeats;
    private Integer availableSeats;    // New field for available seats count
    private String status;             // OPERATIONAL, UNDER_MAINTENANCE, etc.

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScreenFeaturesResponse {
        private Double screenWidth;
        private Double screenHeight;
        private String projectorType;
        private String soundSystem;
    }
}