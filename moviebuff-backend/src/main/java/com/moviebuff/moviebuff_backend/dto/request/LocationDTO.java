// LocationDTO.java
package com.moviebuff.moviebuff_backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;

@Data
public class LocationDTO {
    @NotBlank
    private String address;
    
    @NotBlank
    private String city;
    
    @NotBlank
    private String state;
    
    @NotBlank
    private String zipCode;
    
    private List<Double> coordinates;

    private String googleLink;

}