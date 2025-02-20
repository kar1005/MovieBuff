// src/main/java/com/moviebuff/model/theater/Theater.java
package com.moviebuff.moviebuff_backend.model.theater;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
// import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "theaters")
public class Theater {
    @Id
    private String id;
    private String managerId;
    private String name;
    private List<String> amenities;
    private String description;
    @Email
    private String emailAddress;
    @Pattern(regexp = "^\\+?[0-9]{10,12}$")
    private String phoneNumber;
    private TheaterLocation location;
    private List<Screen> screens;
    private TheaterStatus status;

    private Integer totalScreens;

    @Data
    @SuperBuilder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TheaterLocation {
        private double[] coordinates;
        private String address;
        private String city;
        private String state;
        private String zipCode;
        private String googleLink;
    }

    @Data
    @SuperBuilder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Screen {
        private Integer screenNumber;
        private String screenName;
        private List<String> supportedExperiences;
        private ScreenLayout layout;
        private ScreenFeatures screenFeatures;
        private Integer totalSeats;
        private Boolean isActive;
        private Integer availableSeats;

    }

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public static class ScreenLayout {
    private Integer totalRows;
    private Integer totalColumns;
    private List<Section> sections;
    private List<Aisle> aisles;
    private List<Stair> stairs;
    private List<Exit> exits;
    private List<SeatGap> seatGaps;
    private List<UnavailableSeat> unavailableSeats;
    
    // Method to calculate total available seats
    public Integer calculateTotalAvailableSeats() {
        Set<String> unavailablePositions = new HashSet<>();
        
        // Add unavailable seats to set
        if (unavailableSeats != null) {
            unavailableSeats.forEach(seat -> 
                unavailablePositions.add(seat.getRow() + "-" + seat.getColumn()));
        }
        
        // Add seat gaps to set
        if (seatGaps != null) {
            seatGaps.forEach(gap -> 
                unavailablePositions.add(gap.getRow() + "-" + gap.getColumn()));
        }

        // Count active seats that aren't in unavailable positions
        int totalSeats = 0;
        if (sections != null) {
            for (Section section : sections) {
                if (section.getSeats() != null) {
                    totalSeats += section.getSeats().stream()
                        .filter(seat -> seat.getIsActive() && 
                            !unavailablePositions.contains(seat.getRow() + "-" + seat.getColumn()))
                        .count();
                }
            }
        }
        
        return totalSeats;
    }
}

// Add enum for seat types
public enum SeatType {
    REGULAR,
    RECLINER,
    WHEELCHAIR,
    COMPANION,
    VIP
}


    @Data
    @SuperBuilder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Section {
        private String categoryName;    // Custom category name (e.g., "Recliner Plus", "Executive", etc.)
        private String categoryType;    // Internal reference (PREMIUM, GOLD, SILVER)
        private Double basePrice;
        private List<Seat> seats;      // List of individual seats instead of rows
        private String color;
    }

    @Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public static class Seat {
    private String seatNumber;     // e.g., "A1", "B2"
    private Integer row;
    private Integer column;
    private String type;           // REGULAR, RECLINER, WHEELCHAIR, etc.
    private Boolean isActive;      // To handle gaps/inactive seats

}

    @Data
    @SuperBuilder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Location {
        private Integer row;
        private Integer column;
    }

    @Data
    @SuperBuilder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Aisle {
        private String type; // HORIZONTAL, VERTICAL
        private Integer position;
        private Integer startPosition;
        private Integer endPosition;
        private Integer width;
    }

    @Data
    @SuperBuilder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Stair {
        private String type; // ENTRY, EXIT
        private Location location;
        private Integer width;
        private String direction; // LEFT, RIGHT, CENTER
    }

    @Data
    @SuperBuilder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Exit {
        private String gateNumber;
        private Location location;
        private String type; // EMERGENCY, MAIN, SIDE
        private Integer width;
    }

    @Data
    @SuperBuilder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SeatGap {
        private Integer row;
        private Integer column;
        private Integer width;
    }

    @Data
    @SuperBuilder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UnavailableSeat {
        private Integer row;
        private Integer column;
        private String reason; // STRUCTURAL, EQUIPMENT, DAMAGED
    }

    @Data
    @SuperBuilder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScreenFeatures {
        private Double screenWidth;
        private Double screenHeight;
        private String projectorType;
        private String soundSystem;
    }

    public enum TheaterStatus {
        ACTIVE,
        INACTIVE
    }
}