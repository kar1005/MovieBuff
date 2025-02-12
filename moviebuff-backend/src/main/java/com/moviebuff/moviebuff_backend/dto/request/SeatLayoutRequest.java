// SeatLayoutRequest.java
package com.moviebuff.moviebuff_backend.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.List;

@Data 
public class SeatLayoutRequest {
    @NotNull
    private Integer totalRows;
    @NotNull  
    private Integer totalColumns;
    private List<Section> sections;
    private List<Aisle> aisles;
    private List<Stairs> stairs;
    private List<Exit> exits;
    private List<SeatGap> seatGaps;
    private List<UnavailableSeat> unavailableSeats;

    @Data
    public static class Section {
        @NotBlank
        private String categoryName;    // Custom category name
        private String categoryType;    // PREMIUM, GOLD, SILVER
        @NotNull
        private Double basePrice;
        private List<SeatDTO> seats;
        private String color;
    }

    @Data
    public static class Aisle {
        private String type;            // HORIZONTAL, VERTICAL
        private Integer position;
        private Integer startPosition;
        private Integer endPosition;
        private Integer width;
    }

    @Data
    public static class Stairs {
        private String type;            // ENTRY, EXIT
        private Integer row;
        private Integer column;
        private Integer width;
        private String direction;       // LEFT, RIGHT, CENTER
    }

    @Data
    public static class Exit {
        private String gateNumber;
        private Integer row;
        private Integer column;
        private String type;            // EMERGENCY, MAIN, SIDE
        private Integer width;
    }

    @Data
    public static class SeatGap {
        private Integer row;
        private Integer column;
        private Integer width;
    }

    @Data
    public static class UnavailableSeat {
        private Integer row;
        private Integer column;
        private String reason;          // STRUCTURAL, EQUIPMENT, DAMAGED
    }
}