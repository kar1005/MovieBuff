// TheaterResponse.java
package com.moviebuff.moviebuff_backend.dto.response;

import lombok.Data;
import java.util.*;

import com.moviebuff.moviebuff_backend.dto.request.LocationDTO;
import com.moviebuff.moviebuff_backend.dto.request.ScreenDTO;

import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;


@Data
public class TheaterResponse {
    private String id;
    private String managerId; // ADD THIS FIELD
    private String name;
    private List<String> amenities;
    private String description;
    private String emailAddress;
    private String phoneNumber;
    private Integer totalScreens;
    private LocationDTO location;
    private List<ScreenDTO> screens;
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
        
        // Add these new fields to match your implementation
        private Integer totalScreens;
        private Integer totalCapacity;
        private Integer activeShows;
        private String topMovie;
        private Double monthlyRevenue;
        private Long monthlyBookings;
        
        // These setter methods are needed based on the error messages
        public void setTotalScreens(Integer totalScreens) {
            this.totalScreens = totalScreens;
        }
    
        public void setTotalCapacity(int totalCapacity) {
            this.totalCapacity = totalCapacity;
        }
    
        public void setActiveShows(int activeShows) {
            this.activeShows = activeShows;
        }
    
        public void setTopMovie(String topMovie) {
            this.topMovie = topMovie;
        }
    
        public void setMonthlyRevenue(double monthlyRevenue) {
            this.monthlyRevenue = monthlyRevenue;
        }
    
        public void setMonthlyBookings(long monthlyBookings) {
            this.monthlyBookings = monthlyBookings;
        }    
        
        public String getManagerId() {
        return managerId;
        }
        
        public void setManagerId(String managerId) {
            this.managerId = managerId;
        }
}
}