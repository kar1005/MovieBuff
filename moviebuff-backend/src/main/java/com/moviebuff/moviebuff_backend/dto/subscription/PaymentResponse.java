package com.moviebuff.moviebuff_backend.dto.subscription;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    private String orderId;
    private double amount;
    private String currency;
    private String status;
}