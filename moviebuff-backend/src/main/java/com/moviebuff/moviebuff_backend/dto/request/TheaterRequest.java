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

    @NotNull(message = "ManagerId is required")
    private String managerId;
    
    private List<String> amenities;
    
    private String description;
    
    @Email(message = "Invalid email address")
    private String emailAddress;
    
    @Pattern(regexp = "^\\+?[0-9]{10,12}$", message = "Invalid phone number")
    private String phoneNumber;
    
    private Integer totalScreens;
    
    @NotNull(message = "Location details are required")
    private LocationDTO location;
    
    private List<ScreenDTO> screens;
}