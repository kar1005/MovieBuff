// src/main/java/com/moviebuff/model/theater/Theater.java
package com.moviebuff.moviebuff_backend.model.theater;

import com.moviebuff.moviebuff_backend.model.base.BaseEntity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "theaters")
@EqualsAndHashCode(callSuper = true)
public class Theater extends BaseEntity {
    @Id
    private String id;
    private String managerId;
    private String name;
    private TheaterLocation location;
    private String description;
    private List<Screen> screens;
    private TheaterStatus status;

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
    }

    @Data
    @SuperBuilder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Section {
        private String category; // PREMIUM, GOLD, SILVER
        private Double basePrice;
        private List<SectionRow> rows;
        private String color;
    }

    @Data
    @SuperBuilder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SectionRow {
        private Integer rowNumber;
        private Integer startColumn;
        private Integer endColumn;
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