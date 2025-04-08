package com.moviebuff.moviebuff_backend.dto.subscription;

import java.time.LocalDateTime;
import java.util.List;

import com.moviebuff.moviebuff_backend.model.subscription.PaymentHistory;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for subscription responses
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionResponse {
    private String id;
    private String managerId;
    private double amount;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String status;
    
    // Payment details
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private List<PaymentHistory> paymentHistory;
    
    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Subscription plan details
    private PlanDetails plan;
    
    /**
     * Inner class for plan details within the subscription response
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlanDetails {
        private String id;
        private String name;
        private String description;
        private Double price;
        private String duration;
        private List<String> features;
        private Boolean isActive;
    }
}