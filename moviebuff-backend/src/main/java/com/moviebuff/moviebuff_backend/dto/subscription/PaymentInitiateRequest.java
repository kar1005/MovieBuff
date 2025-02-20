package com.moviebuff.moviebuff_backend.dto.subscription;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentInitiateRequest {
    @NotNull(message = "Subscription ID is required")
    private String subscriptionId;
    
    @NotNull(message = "Amount is required")
    @Min(value = 1, message = "Amount must be greater than 0")
    private double amount;
    
    private String currency = "INR";
}
