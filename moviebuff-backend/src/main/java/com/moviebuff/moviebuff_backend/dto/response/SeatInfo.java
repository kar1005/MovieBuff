// SeatInfo.java
package com.moviebuff.moviebuff_backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SeatInfo {
    private String seatNumber;
    private Integer row;
    private Integer column;
    private String categoryName;    // Custom category name (e.g., "Recliner Plus")
    private String categoryType;    // Internal reference (PREMIUM, GOLD, SILVER)
    private Double price;
    private String type;           // REGULAR, RECLINER, WHEELCHAIR, etc.
    private Boolean isActive;
    private Boolean isAvailable;
    private String unavailableReason;  // If seat is unavailable, store reason
}