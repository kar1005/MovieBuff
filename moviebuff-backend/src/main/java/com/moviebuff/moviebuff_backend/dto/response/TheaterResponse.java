// TheaterResponse.java
package com.moviebuff.moviebuff_backend.dto.response;

import lombok.Data;
import java.util.*;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;


@Data
public class TheaterResponse {
    private String id;
    private String name;
    private List<String> amenities;
    private String description;
    private String emailAddress;
    private String phoneNumber;
    private Integer totalScreens;
    private LocationResponseDTO location;
    private List<ScreenResponseDTO> screens;
    private String status;
    private TheaterStats stats;        // New field for theater statistics

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TheaterStats {
        private Integer totalSeats;
        private Integer availableSeats;
        private Integer activeScreens;
        private Integer totalShowsToday;
        private Double occupancyRate;
    }
}