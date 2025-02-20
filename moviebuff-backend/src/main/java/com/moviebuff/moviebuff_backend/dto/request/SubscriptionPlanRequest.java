package com.moviebuff.moviebuff_backend.dto.request;
import java.util.List;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class SubscriptionPlanRequest {
    @NotBlank(message = "Plan name is required")
    private String name;
    
    private String description;
    
    @NotNull(message = "Price is required")
    @Min(value = 0, message = "Price must be greater than 0")
    private Double price;
    
    @NotBlank(message = "Duration is required")
    @Pattern(regexp = "^(MONTHLY|YEARLY)$", message = "Duration must be either MONTHLY or YEARLY")
    private String duration;
    
    private List<String> features;
    
    private Boolean isActive = true;
}
