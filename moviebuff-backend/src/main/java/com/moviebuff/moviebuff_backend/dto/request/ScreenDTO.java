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
    
    private SeatLayoutRequest layout;  // Changed from Map to SeatLayoutRequest
    
    private ScreenRequest.ScreenFeatures features;  // Changed to proper type
    
    private Integer totalSeats;
}