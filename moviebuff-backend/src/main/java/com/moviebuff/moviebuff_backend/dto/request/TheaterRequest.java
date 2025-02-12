// TheaterRequest.java
package com.moviebuff.moviebuff_backend.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TheaterRequest {
    @NotBlank(message = "Theater name is required")
    private String name;
    
    private List<String> amenities;
    
    private String description;
    
    @Email(message = "Invalid email address")
    private String emailAddress;
    
    @Pattern(regexp = "^\\+?[0-9]{10,12}$", message = "Invalid phone number")
    private String phoneNumber;
    
    @Min(value = 1, message = "Theater must have at least one screen")
    private Integer totalScreens;
    
    @NotNull(message = "Location details are required")
    private LocationDTO location;
    
    @NotNull(message = "At least one screen configuration is required")
    private List<ScreenDTO> screens;
}