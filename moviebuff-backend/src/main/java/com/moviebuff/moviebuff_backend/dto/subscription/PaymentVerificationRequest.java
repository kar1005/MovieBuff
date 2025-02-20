package com.moviebuff.moviebuff_backend.dto.subscription;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentVerificationRequest {
    @NotNull(message = "Razorpay Order ID is required")
    private String razorpayOrderId;
    
    @NotNull(message = "Razorpay Payment ID is required")
    private String razorpayPaymentId;
    
    @NotNull(message = "Razorpay Signature is required")
    private String razorpaySignature;
}
