// SeatDTO.java
package com.moviebuff.moviebuff_backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SeatDTO {
    @NotNull
    private Integer row;
    @NotNull
    private Integer column;
    @NotNull
    private String seatNumber;
    private String type;    // REGULAR, RECLINER, WHEELCHAIR, etc.
    private Boolean isActive;
}