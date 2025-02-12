// LocationResponse.java
package com.moviebuff.moviebuff_backend.dto.response;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LocationResponseDTO {
    private String address;
    private String city;
    private String state;
    private String zipCode;
    private List<Double> coordinates;
    private String formattedAddress;  // Additional field for response
}