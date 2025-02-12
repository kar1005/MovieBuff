// ScreenLayoutResponseDTO.java
package com.moviebuff.moviebuff_backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScreenLayoutResponseDTO {
    private Integer totalRows;
    private Integer totalColumns;
    private List<SectionResponse> sections;
    private List<AisleResponse> aisles;
    private List<StairResponse> stairs;
    private List<ExitResponse> exits;
    private List<SeatInfo> seats;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SectionResponse {
        private String categoryName;
        private String categoryType;
        private Double basePrice;
        private String color;
        private Integer totalSeats;
        private List<SeatInfo> seats;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AisleResponse {
        private String type;
        private Integer position;
        private Integer startPosition;
        private Integer endPosition;
        private Integer width;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StairResponse {
        private String type;
        private Integer row;
        private Integer column;
        private Integer width;
        private String direction;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExitResponse {
        private String gateNumber;
        private Integer row;
        private Integer column;
        private String type;
        private Integer width;
    }
}