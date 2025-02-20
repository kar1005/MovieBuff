package com.moviebuff.moviebuff_backend.model.subscription;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "subscriptions")
public class Subscription {
    @Id
    private String id;
    
    private String managerId;
    private String planId;
    
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String razorpaySignature;
    
    private double amount;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private SubscriptionStatus status;
    
    private List<PaymentHistory> paymentHistory;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    @CreatedDate
    private LocalDateTime createdAt;

    public enum SubscriptionStatus {
        ACTIVE,
        EXPIRED,
        CANCELLED,
        PENDING,
        PAYMENT_FAILED
    }
    
    public enum PaymentMethod {
        RAZORPAY,
        BANK_TRANSFER,
        WALLET
    }
    
    public enum PaymentStatus {
        SUCCESS,
        FAILED,
        PENDING,
        REFUNDED
    }
}

