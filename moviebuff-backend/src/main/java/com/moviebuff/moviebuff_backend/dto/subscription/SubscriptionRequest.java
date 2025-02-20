package com.moviebuff.moviebuff_backend.dto.subscription;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionRequest {
    @NotNull(message = "Manager ID is required")
    private String managerId;
    
    @NotNull(message = "Plan ID is required")
    private String planId;
}

